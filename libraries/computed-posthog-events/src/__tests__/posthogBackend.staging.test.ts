// @vitest-environment node
// (happy-dom's fetch strips the Authorization header on cross-origin requests, which breaks the HogQL read.)
/**
 * Model-based testing: validate the model against the system under test.
 *
 * `posthogBackend.ts` is a *model* of PostHog's ingestion. Its assumptions are largely undocumented,
 * so we pin them down empirically and keep the model honest. The invariants the model encodes are the
 * test oracle: `identify.test.ts` asserts they hold for the MODEL (fast, in CI); the tests here assert
 * the SAME invariants hold for the real SYSTEM (PostHog), so if PostHog ever changes behaviour these
 * fail and tell us the model has drifted.
 *
 * Invariants (each maps to behaviour in posthogBackend.ts):
 *   I1  a track event creates/uses a person for its distinct_id
 *   I2  a `$identify` carrying `$anon_distinct_id` merges the anonymous person into the identified one
 *       (both distinct ids then resolve to a single person)
 *   I3  the merge in I2 happens whether the batch is live or sent with historical_migration
 *   I4  the `$set` on that identify updates the merged person's properties — also under both live and
 *       historical_migration (an earlier "dropped under historical" reading turned out to be a HogQL
 *       query-cache artifact; bypass the cache with refresh:'force_blocking', as `hogql` below does)
 *
 * These hit real PostHog (the Dev/testing project 50809), are slow (ingestion + person-merge lag) and
 * rate-limited (HogQL: 120/hr), so they are SKIPPED by default. Run them manually to re-validate the
 * model — from libraries/computed-posthog-events:
 *
 *   POSTHOG_MODEL_CHECK=1 npm test -- posthogBackend.staging
 *
 * They read the staging NEXT_PUBLIC_POSTHOG_KEY (ingestion -> project 50809) and POSTHOG_PERSONAL_API_KEY
 * (HogQL read) directly from apps/website/.env.local (vitest's test.env doesn't expose them). The model's
 * CI tests live in identify.test.ts.
 */
/* eslint-disable turbo/no-undeclared-env-vars -- POSTHOG_MODEL_CHECK is read only by the default-skipped manual run, so it doesn't affect turbo caching */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  beforeAll, describe, expect, test,
} from 'vitest';

const ENABLED = process.env.POSTHOG_MODEL_CHECK === '1';
const STAGING_PROJECT = 50809;
const INGEST_HOST = 'https://eu.i.posthog.com';
const QUERY_HOST = 'https://eu.posthog.com';

// Loaded in beforeAll from apps/website/.env.local (only when the check is enabled).
let writeKey = '';
let readKey = '';

const sleep = (ms: number) => new Promise<void>((r) => {
  setTimeout(r, ms);
});
const uuid = () => globalThis.crypto.randomUUID();
const sqlStr = (s: string) => `'${s.replace(/'/g, '\'\'')}'`;

type WireEvent = { event: string; distinct_id: string; uuid: string; timestamp: string; properties?: Record<string, unknown> };

async function ingest(batch: WireEvent[], historicalMigration: boolean) {
  const res = await fetch(`${INGEST_HOST}/batch/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: writeKey, historical_migration: historicalMigration, batch }),
  });
  if (!res.ok) throw new Error(`ingest failed: ${res.status} ${await res.text()}`);
}

async function hogql(query: string): Promise<unknown[][]> {
  const res = await fetch(`${QUERY_HOST}/api/projects/${STAGING_PROJECT}/query/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${readKey}` },
    // force_blocking bypasses the query cache: the poll re-runs the same query, and a cached empty
    // result from before the data landed would otherwise be returned for the whole cache TTL.
    body: JSON.stringify({ query: { kind: 'HogQLQuery', query }, refresh: 'force_blocking' }),
  });
  if (!res.ok) throw new Error(`hogql failed: ${res.status} ${await res.text()}`);
  return (await res.json() as { results?: unknown[][] }).results ?? [];
}

// Poll a query until it returns something matching `done` (ingestion + person-merge are async).
// Staging ingestion latency is variable (seconds to minutes), so the budget is deliberately generous.
async function pollHogql<T>(query: string, done: (rows: unknown[][]) => T | undefined, tries = 30, delayMs = 8000): Promise<T> {
  for (let i = 0; i < tries; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    const result = done(await hogql(query));
    if (result !== undefined) return result;
    // eslint-disable-next-line no-await-in-loop
    await sleep(delayMs);
  }

  throw new Error(`timed out after ${tries} polls: ${query}`);
}

// distinct_id -> resolved person_id, and that person's email property, for a set of distinct ids.
const personRows = (ids: string[]) => `SELECT pdi.distinct_id AS did, p.id AS pid, p.properties.email AS email FROM person_distinct_ids AS pdi JOIN persons AS p ON p.id = pdi.person_id WHERE pdi.distinct_id IN (${ids.map(sqlStr).join(', ')})`;

// Both distinct ids present and resolving to a single person (the merge happened).
const isMerged = (rows: unknown[][]) => rows.length >= 2 && new Set(rows.map((r) => r[1])).size === 1;

(ENABLED ? describe : describe.skip)('posthogBackend model vs real PostHog (staging 50809)', () => {
  beforeAll(() => {
    // vitest runs with cwd = this package dir; the website env lives at the repo root.
    const envPath = resolve(process.cwd(), '../../apps/website/.env.local');
    const env = readFileSync(envPath, 'utf8');
    const read = (name: string) => new RegExp(`^${name}=(.*)$`, 'm').exec(env)?.[1]?.trim() ?? '';
    writeKey = read('NEXT_PUBLIC_POSTHOG_KEY');
    readKey = read('POSTHOG_PERSONAL_API_KEY');
  });

  test('I2 + I4 (live): an identify merges the anonymous browser into the email person and sets the email property', async () => {
    const run = uuid().slice(0, 8);
    const anon = `mbt-anon-${run}`;
    const email = `mbt-${run}@bluedot-mbt.test`;

    // anonymous browsing, then a live identify carrying $anon_distinct_id + $set (as the engine sends it)
    await ingest([{
      event: '$pageview', distinct_id: anon, uuid: uuid(), timestamp: new Date().toISOString(),
    }], false);
    await ingest([{
      event: '$identify', distinct_id: email, uuid: uuid(), timestamp: new Date().toISOString(), properties: { $anon_distinct_id: anon, $set: { email } },
    }], false);

    // Poll until merged AND the email property has propagated (the property write can lag the merge
    // by a poll). Reaching this resolved state confirms both I2 (merge) and I4-live ($set applied).
    const merged = await pollHogql(
      personRows([anon, email]),
      (rows) => (isMerged(rows) && rows.every((r) => r[2] === email) ? rows : undefined),
    );

    expect(new Set(merged.map((r) => r[1])).size).toBe(1); // I2
    expect(merged.every((r) => r[2] === email)).toBe(true); // I4 (live)
  }, 300_000);

  test('I3 + I4 (historical): a historical identify still merges and still applies the $set', async () => {
    const run = uuid().slice(0, 8);
    const anon = `mbt-anon-h-${run}`;
    const email = `mbt-h-${run}@bluedot-mbt.test`;
    const old = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();

    await ingest([{
      event: '$pageview', distinct_id: anon, uuid: uuid(), timestamp: old,
    }], true);
    await ingest([{
      event: '$identify', distinct_id: email, uuid: uuid(), timestamp: old, properties: { $anon_distinct_id: anon, $set: { email } },
    }], true);

    // I3: the merge happens under historical_migration; I4: the $set applies there too.
    const merged = await pollHogql(
      personRows([anon, email]),
      (rows) => (isMerged(rows) && rows.every((r) => r[2] === email) ? rows : undefined),
    );

    expect(new Set(merged.map((r) => r[1])).size).toBe(1); // I3
    expect(merged.every((r) => r[2] === email)).toBe(true); // I4 (historical)
  }, 300_000);
});
