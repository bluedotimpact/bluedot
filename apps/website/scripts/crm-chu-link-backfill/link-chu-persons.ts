/* eslint-disable no-console, no-await-in-loop, turbo/no-undeclared-env-vars, @typescript-eslint/no-explicit-any */
// One-off backfill (#2809): link CRM "Course Hub User" records that predate the "Add Person to
// Course Hub User" automation to their Person, matched by primary email. Link-only — records
// whose email matches no Person, several Persons, or a Person that already has a Course Hub
// user link are skipped and reported. --created-before defaults to the automation cutover so
// this never races the live automation on fresh records.
//
//   Dry run: npx dotenv -e apps/website/.env.local -- npx tsx apps/website/scripts/crm-chu-link-backfill/link-chu-persons.ts
//   Live:    same, with --live
//   Options: --limit <n>, --created-before <iso date>, --report <path> (JSON incl. emails — keep outside the repo)

import fs from 'fs';

const TOKEN = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const BASE = 'apppOzz9fPg59PxLa';
const PERSON_TABLE = 'tblMYYK8bL2fRJmv7';
const CHU_TABLE = 'tbl1A7MZRon8X8P36';
const CHU_EMAIL = 'Email';
const CHU_CREATED = 'Created';
const CHU_PERSON_LINK = '[>] Person';
const PERSON_PRIMARY = 'Primary email';
const PERSON_SECONDARY = 'Secondary email';
const PERSON_CHU_LINK = 'Course Hub user';

type Args = { live: boolean; limit: number | null; createdBefore: string; report: string | null };

function argValue(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i !== -1) return argv[i + 1];
  return argv.find((a) => a.startsWith(`${name}=`))?.split('=').slice(1).join('=');
}

function parseArgs(argv: string[]): Args {
  return {
    live: argv.includes('--live'),
    limit: argValue(argv, '--limit') ? parseInt(argValue(argv, '--limit')!, 10) : null,
    createdBefore: argValue(argv, '--created-before') ?? '2026-07-22T00:00:00.000Z',
    report: argValue(argv, '--report') ?? null,
  };
}

const sleep = (ms: number) => new Promise((r) => {
  setTimeout(r, ms);
});

async function api(method: string, path: string, body?: unknown): Promise<any> {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetch(`https://api.airtable.com/v0/${path}`, {
      method,
      headers: { Authorization: `Bearer ${TOKEN}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return res.json();
    const text = await res.text();
    if (![429, 500, 502, 503, 504].includes(res.status) || attempt >= 6) {
      throw new Error(`${method} ${path} -> ${res.status} ${text}`);
    }

    const wait = Math.min(30000, 1000 * 2 ** (attempt - 1));
    console.log(`  retry ${attempt}/5 after ${res.status}; waiting ${wait}ms`);
    await sleep(wait);
  }
}

async function listAll(tableId: string, fields: string[], filterByFormula?: string, label?: string): Promise<any[]> {
  const out: any[] = [];
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: '100' });
    fields.forEach((f) => params.append('fields[]', f));
    if (filterByFormula) params.set('filterByFormula', filterByFormula);
    if (offset) params.set('offset', offset);
    const body = await api('GET', `${BASE}/${tableId}?${params}`);
    out.push(...body.records);
    offset = body.offset;
    if (label && out.length % 5000 < 100) console.log(`  ${label}: fetched ${out.length}...`);
    await sleep(250);
  } while (offset);

  return out;
}

const norm = (s: unknown) => (typeof s === 'string' ? s.trim().toLowerCase() : '');

async function main() {
  if (!TOKEN) {
    console.error('AIRTABLE_PERSONAL_ACCESS_TOKEN not set');
    process.exit(1);
  }

  const args = parseArgs(process.argv.slice(2));
  console.log(`Mode: ${args.live ? 'LIVE' : 'DRY RUN'}; createdBefore=${args.createdBefore}; limit=${args.limit ?? 'none'}`);

  console.log('Scanning Person table...');
  const persons = await listAll(PERSON_TABLE, [PERSON_PRIMARY, PERSON_SECONDARY, PERSON_CHU_LINK], undefined, 'persons');
  const byPrimary = new Map<string, string[]>();
  const bySecondary = new Map<string, string[]>();
  const personHasChu = new Set<string>();
  for (const p of persons) {
    const pri = norm(p.fields[PERSON_PRIMARY]);
    if (pri) (byPrimary.get(pri) ?? byPrimary.set(pri, []).get(pri)!).push(p.id);
    const sec = norm(p.fields[PERSON_SECONDARY]);
    if (sec) (bySecondary.get(sec) ?? bySecondary.set(sec, []).get(sec)!).push(p.id);
    if ((p.fields[PERSON_CHU_LINK] ?? []).length > 0) personHasChu.add(p.id);
  }

  console.log(`Persons: ${persons.length} (${byPrimary.size} distinct primary emails, ${personHasChu.size} already have a Course Hub user link)`);

  console.log('Scanning unlinked Course Hub User records...');
  const filter = `AND({${CHU_PERSON_LINK}} = BLANK(), IS_BEFORE({${CHU_CREATED}}, '${args.createdBefore}'))`;
  const chus = await listAll(CHU_TABLE, [CHU_EMAIL, CHU_CREATED], filter, 'chu');
  console.log(`Unlinked CHU records created before ${args.createdBefore}: ${chus.length}`);

  const buckets = {
    toLink: [] as { chuId: string; personId: string; email: string }[],
    noEmail: [] as string[],
    ambiguous: [] as { chuId: string; email: string; personIds: string[] }[],
    personAlreadyLinked: [] as { chuId: string; email: string; personId: string }[],
    secondaryOnly: [] as { chuId: string; email: string; personIds: string[] }[],
    noMatch: [] as { chuId: string; email: string }[],
  };
  const claimedPersons = new Set<string>();
  for (const r of chus) {
    const email = norm(r.fields[CHU_EMAIL]);
    if (!email) {
      buckets.noEmail.push(r.id);
      continue;
    }

    const primary = byPrimary.get(email) ?? [];
    if (primary.length > 1) {
      buckets.ambiguous.push({ chuId: r.id, email, personIds: primary });
      continue;
    }

    if (primary.length === 1) {
      const personId = primary[0]!;
      if (personHasChu.has(personId) || claimedPersons.has(personId)) {
        buckets.personAlreadyLinked.push({ chuId: r.id, email, personId });
      } else {
        claimedPersons.add(personId);
        buckets.toLink.push({ chuId: r.id, personId, email });
      }

      continue;
    }

    const secondary = bySecondary.get(email) ?? [];
    if (secondary.length > 0) {
      buckets.secondaryOnly.push({ chuId: r.id, email, personIds: secondary });
      continue;
    }

    buckets.noMatch.push({ chuId: r.id, email });
  }

  const toLink = args.limit ? buckets.toLink.slice(0, args.limit) : buckets.toLink;
  console.log('\nClassification:');
  console.log(`  will link (unique primary-email match, Person unclaimed): ${buckets.toLink.length}${args.limit ? ` (capped to ${toLink.length})` : ''}`);
  console.log(`  skipped - no email on record:                             ${buckets.noEmail.length}`);
  console.log(`  skipped - ambiguous (email matches >1 Person):            ${buckets.ambiguous.length}`);
  console.log(`  skipped - matched Person already has a CHU link:          ${buckets.personAlreadyLinked.length}`);
  console.log(`  skipped - matches Secondary email only:                   ${buckets.secondaryOnly.length}`);
  console.log(`  skipped - no matching Person (manual review):             ${buckets.noMatch.length}`);

  const idsOnly = (rows: { chuId: string }[]) => rows.map((r) => r.chuId);
  console.log('\nSkipped record ids (CHU):');
  console.log(`  ambiguous:            ${JSON.stringify(idsOnly(buckets.ambiguous))}`);
  console.log(`  personAlreadyLinked:  ${JSON.stringify(idsOnly(buckets.personAlreadyLinked))}`);
  console.log(`  secondaryOnly:        ${JSON.stringify(idsOnly(buckets.secondaryOnly))}`);
  console.log(`  noMatch:              ${JSON.stringify(idsOnly(buckets.noMatch))}`);

  if (args.report) {
    fs.writeFileSync(args.report, JSON.stringify({ generatedAt: new Date().toISOString(), args, buckets }, null, 2));
    console.log(`\nFull report (contains emails - keep out of the repo): ${args.report}`);
  }

  if (!args.live) {
    console.log('\nDRY RUN complete - nothing written. Re-run with --live to write.');
    return;
  }

  console.log(`\nWriting ${toLink.length} links...`);
  let written = 0;
  for (let i = 0; i < toLink.length; i += 10) {
    const records = toLink.slice(i, i + 10).map((u) => ({ id: u.chuId, fields: { [CHU_PERSON_LINK]: [u.personId] } }));
    await api('PATCH', `${BASE}/${CHU_TABLE}`, { records });
    written += records.length;
    if (written % 500 < 10) console.log(`  written ${written}/${toLink.length}`);
    await sleep(250);
  }

  console.log(`DONE: linked ${written} Course Hub User records.`);
}

main().then(() => process.exit(0)).catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
