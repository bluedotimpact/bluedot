/* eslint-disable no-console, no-await-in-loop, turbo/no-undeclared-env-vars */
// One-off backfill (#2713, step 3): send PostHog `$create_alias` events linking each existing
// user's Keycloak `sub` onto their email person, replicating the login-time call shipped in
// #2767 (`posthog.alias(auth.sub, auth.email)` in libraries/ui/src/utils/auth.tsx). After this,
// every existing user can be identified by either email or sub and resolves to the same person.
//
// Pre-filter (per prod decision): only users whose email ALREADY has a PostHog person are
// aliased. Emails PostHog has never seen are skipped — no person profiles are created for them;
// those users simply accrue history under the sub distinct_id once the identify flips to sub.
// Users whose sub already appears as a `$create_alias` alias (organically linked since #2767
// deployed, or by a previous run of this script) are also skipped, which makes re-runs and
// resumes idempotent by construction.
//
// The event sent is byte-for-byte the shape posthog-js produces for `alias(sub, email)`:
//   { event: '$create_alias', distinct_id: <email>, properties: { alias: <sub>, distinct_id: <email> } }
// PostHog merges the two persons (verified on the EU instance 2026-07-08 across all cohorts,
// including the documented footgun of aliasing onto an already-identified sub — see #2713).
//
// Reads users from the Postgres replica (never Airtable). Sends only to the PostHog project
// given by --project. Pass --dry-run to only print classification counts and send nothing.
// No emails or subs are ever logged — output is counts, record ids and autoNumberId cursors.
// Needs PG_URL (unless --input) and POSTHOG_PERSONAL_API_KEY in the environment.
//
//   # dry run (reads only, nothing sent)
//   npx dotenv -e apps/website/.env.local -- npx tsx apps/website/scripts/posthog-alias-backfill/backfill-alias.ts --project <project-id> --dry-run
//   # the real run
//   npx dotenv -e apps/website/.env.local -- npx tsx apps/website/scripts/posthog-alias-backfill/backfill-alias.ts --project <project-id>
//
// Resume after an interruption with --from <autoNumberId> (printed in the progress file and on
// every batch). Re-sending an alias a second time is a server-side no-op, and already-sent subs
// are excluded on the next run anyway, so over-resuming is safe.

import fs from 'fs';
import {
  PgAirtableDb, userTable, and, asc, gt, isNotNull,
} from '@bluedot/db';

const API_BASE = 'https://eu.posthog.com';

type ScriptOptions = {
  project: number;
  dryRun: boolean;
  limit: number | null;
  from: number | null;
  input: string | null;
  batchSize: number;
  sleepMs: number;
  pageSize: number;
  progressFile: string;
};

type BackfillUser = { id: string; autoNumberId: number; email: string; sub: string };

function argValue(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  if (i !== -1) return args[i + 1];
  return args.find((a) => a.startsWith(`${name}=`))?.split('=').slice(1).join('=');
}

function parseArgs(argv: string[]): ScriptOptions {
  const args = argv.slice(2);
  const project = Number(argValue(args, '--project'));
  if (!Number.isInteger(project)) {
    console.error('Usage: --project <id> [--dry-run] [--limit N] [--from autoNumberId] [--input cohort.json] [--batch-size N] [--sleep-ms N] [--page-size N] [--progress file]');
    process.exit(1);
  }

  const limit = argValue(args, '--limit');
  const from = argValue(args, '--from');
  return {
    project,
    dryRun: args.includes('--dry-run'),
    limit: limit !== undefined ? Number(limit) : null,
    from: from !== undefined ? Number(from) : null,
    input: argValue(args, '--input') ?? null,
    batchSize: Number(argValue(args, '--batch-size') ?? 100),
    sleepMs: Number(argValue(args, '--sleep-ms') ?? 500),
    pageSize: Number(argValue(args, '--page-size') ?? 40000),
    progressFile: argValue(args, '--progress') ?? `alias-backfill-progress-${project}.json`,
  };
}

const sleep = (ms: number) => new Promise((resolve) => {
  setTimeout(resolve, ms);
});

const personalApiKey = () => {
  const key = process.env.POSTHOG_PERSONAL_API_KEY;
  if (!key) {
    console.error('POSTHOG_PERSONAL_API_KEY is not set');
    process.exit(1);
  }

  return key;
};

async function hogql(project: number, query: string): Promise<unknown[][]> {
  const res = await fetch(`${API_BASE}/api/projects/${project}/query/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${personalApiKey()}` },
    // force_blocking bypasses the query cache — resumed runs must see just-sent aliases
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query }, refresh: 'force_blocking' }),
  });
  if (!res.ok) throw new Error(`HogQL query failed: ${res.status} ${await res.text()}`);
  return (await res.json() as { results: unknown[][] }).results;
}

const escapeHogql = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, '\\\'');

/** Cursor-paginate a single-string-column query ordered by that column (HogQL caps rows per query). */
async function fetchAllStrings(project: number, columnExpr: string, source: string, pageSize: number): Promise<string[]> {
  const out: string[] = [];
  let cursor: string | null = null;
  for (;;) {
    const where = cursor === null ? '' : `AND ${columnExpr} > '${escapeHogql(cursor)}'`;
    const rows = await hogql(project, `
      SELECT DISTINCT ${columnExpr} AS v FROM ${source} ${where} ORDER BY v LIMIT ${pageSize}`);
    for (const row of rows) out.push(String(row[0]));
    if (rows.length < pageSize) return out;
    cursor = out[out.length - 1]!;
  }
}

/** The capture API authenticates with the project write key (phc_...), not the personal key. */
async function getWriteKey(project: number): Promise<string> {
  const res = await fetch(`${API_BASE}/api/projects/${project}/`, {
    headers: { Authorization: `Bearer ${personalApiKey()}` },
  });
  if (!res.ok) throw new Error(`get project failed: ${res.status} ${await res.text()}`);
  const writeKey = ((await res.json()) as { api_token: string }).api_token;
  if (!writeKey?.startsWith('phc_')) throw new Error('unexpected write key format');
  return writeKey;
}

async function loadUsersFromPg(from: number | null): Promise<BackfillUser[]> {
  if (!process.env.PG_URL) {
    console.error('PG_URL is not set');
    process.exit(1);
  }

  // Read-only: only the Postgres replica is touched, so no real Airtable key is needed
  const db = new PgAirtableDb({ pgConnString: process.env.PG_URL, airtableApiKey: 'read-only-airtable-disabled' });
  const rows = await db.pg
    .select({
      id: userTable.pg.id,
      autoNumberId: userTable.pg.autoNumberId,
      email: userTable.pg.email,
      sub: userTable.pg.keycloakIdentifier,
    })
    .from(userTable.pg)
    .where(and(isNotNull(userTable.pg.keycloakIdentifier), gt(userTable.pg.autoNumberId, from ?? -1)))
    .orderBy(asc(userTable.pg.autoNumberId));

  return rows.map((row) => ({
    id: row.id, autoNumberId: Number(row.autoNumberId), email: row.email, sub: row.sub!,
  }));
}

function loadUsersFromFile(inputPath: string): BackfillUser[] {
  const parsed = JSON.parse(fs.readFileSync(inputPath, 'utf-8')) as { id: string; email: string; sub: string }[];
  return parsed.map((row, i) => ({
    id: row.id, autoNumberId: i + 1, email: row.email, sub: row.sub,
  }));
}

type Classified = {
  send: (BackfillUser & { distinctId: string; matchKind: 'exact' | 'lowercase' })[];
  counts: Record<string, number>;
};

function classify(users: BackfillUser[], posthogEmails: string[], aliasedSubs: Set<string>): Classified {
  const exact = new Set(posthogEmails);
  const byLower = new Map<string, string[]>();
  for (const email of posthogEmails) {
    const lower = email.toLowerCase();
    byLower.set(lower, [...(byLower.get(lower) ?? []), email]);
  }

  const seenSubs = new Set<string>();
  const counts: Record<string, number> = {
    send_exact: 0, send_lowercase: 0, skip_already_aliased: 0, skip_no_posthog_person: 0, skip_ambiguous_case: 0, skip_duplicate_sub: 0, skip_invalid: 0,
  };
  const send: Classified['send'] = [];

  for (const user of users) {
    // email must look like an email and sub must not (guards against swapped or malformed data)
    if (!user.email?.includes('@') || !user.sub || user.sub.includes('@')) {
      counts.skip_invalid! += 1;
    } else if (seenSubs.has(user.sub)) {
      counts.skip_duplicate_sub! += 1;
    } else if (aliasedSubs.has(user.sub)) {
      seenSubs.add(user.sub);
      counts.skip_already_aliased! += 1;
    } else if (exact.has(user.email)) {
      seenSubs.add(user.sub);
      counts.send_exact! += 1;
      send.push({ ...user, distinctId: user.email, matchKind: 'exact' });
    } else {
      const variants = byLower.get(user.email.toLowerCase()) ?? [];
      if (variants.length === 1) {
        seenSubs.add(user.sub);
        counts.send_lowercase! += 1;
        send.push({ ...user, distinctId: variants[0]!, matchKind: 'lowercase' });
      } else if (variants.length > 1) {
        counts.skip_ambiguous_case! += 1;
      } else {
        counts.skip_no_posthog_person! += 1;
      }
    }
  }

  return { send, counts };
}

async function main() {
  const options = parseArgs(process.argv);

  console.log(`project=${options.project} dryRun=${options.dryRun} limit=${options.limit ?? 'none'} from=${options.from ?? 'start'} source=${options.input ?? 'postgres'}`);

  const users = options.input ? loadUsersFromFile(options.input) : await loadUsersFromPg(options.from);
  console.log(`loaded ${users.length} users with a keycloakIdentifier`);

  console.log('fetching existing email distinct_ids and already-aliased subs from PostHog...');
  const posthogEmails = await fetchAllStrings(options.project, 'distinct_id', 'person_distinct_ids WHERE distinct_id LIKE \'%@%\'', options.pageSize);
  const aliasedSubs = new Set(await fetchAllStrings(options.project, 'properties.alias', 'events WHERE event = \'$create_alias\'', options.pageSize));
  console.log(`posthog: ${posthogEmails.length} email-like distinct_ids, ${aliasedSubs.size} already-aliased subs`);

  const { send, counts } = classify(users, posthogEmails, aliasedSubs);
  const toSend = options.limit !== null ? send.slice(0, options.limit) : send;

  console.log('\nclassification:');
  for (const [key, value] of Object.entries(counts)) console.log(`  ${key}: ${value}`);
  console.log(`would send: ${send.length}${options.limit !== null ? ` (limited to ${toSend.length})` : ''}`);

  if (options.dryRun) {
    console.log('\nDRY RUN — nothing sent.');
    return;
  }

  if (toSend.length === 0) {
    console.log('nothing to send');
    return;
  }

  const writeKey = await getWriteKey(options.project);
  const startedAt = Date.now();
  let sent = 0;
  for (let i = 0; i < toSend.length; i += options.batchSize) {
    const batch = toSend.slice(i, i + options.batchSize).map((user) => ({
      event: '$create_alias',
      distinct_id: user.distinctId,
      timestamp: new Date().toISOString(),
      properties: { alias: user.sub, distinct_id: user.distinctId },
    }));
    const res = await fetch(`${API_BASE}/batch/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: writeKey, historical_migration: false, batch }),
    });
    if (!res.ok) {
      const priorCursor = i === 0 ? options.from : toSend[i - 1]!.autoNumberId;
      const resumeHint = priorCursor === null ? 're-run without --from' : `resume with --from ${priorCursor}`;
      throw new Error(`/batch failed after ${sent} sends (${resumeHint}): ${res.status} ${await res.text()}`);
    }

    sent += batch.length;
    const last = toSend[Math.min(i + options.batchSize, toSend.length) - 1]!;
    fs.writeFileSync(options.progressFile, `${JSON.stringify({
      project: options.project, lastAutoNumberId: last.autoNumberId, lastRecordId: last.id, sent, at: new Date().toISOString(),
    }, null, 2)}\n`);
    console.log(`sent ${sent}/${toSend.length} (cursor autoNumberId=${last.autoNumberId} record=${last.id})`);
    if (sent < toSend.length) await sleep(options.sleepMs);
  }

  const seconds = (Date.now() - startedAt) / 1000;
  console.log(`\ndone: ${sent} $create_alias events in ${seconds.toFixed(1)}s (${(sent / seconds).toFixed(1)}/s)`);
}

main().then(() => process.exit(0)).catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
