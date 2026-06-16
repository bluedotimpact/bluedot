/* eslint-disable no-console, @typescript-eslint/no-explicit-any, no-await-in-loop, turbo/no-undeclared-env-vars, @typescript-eslint/use-unknown-in-catch-callback-variable */
// One-off migration backfill (#2526): populates self_serve_course_registration from the legacy
// Future of AI rows in course_registration.
//
// Copies every legacy FoAI row with decision='Accept', carrying certificateId values verbatim so
// existing certificate URLs keep resolving. Idempotent and re-runnable: a row whose email already
// has a self-serve entry is skipped, and a self-serve row missing its certificate is healed.
//
// Run once dual-writes are live in production and before reads switch over to the self-serve table.
// Defaults to a dry run that reads, prints a plan, and writes nothing; pass --live to execute.
// Needs PG_URL and AIRTABLE_PERSONAL_ACCESS_TOKEN in the environment.
//
//   # dry run
//   npx dotenv -e apps/website/.env.local -- npx tsx apps/website/scripts/foai-migration/backfill-self-serve.ts --mode airtable
//   # execute
//   npx dotenv -e apps/website/.env.local -- npx tsx apps/website/scripts/foai-migration/backfill-self-serve.ts --mode airtable --live --confirm-airtable-writes
//
// --mode pg is a local-only rehearsal that writes straight to a Postgres restore (no Airtable).

import {
  and, eq, courseRegistrationTable, selfServeCourseRegistrationTable, PgAirtableTable,
  PgAirtableDb, type CourseRegistration,
} from '@bluedot/db';

const FOAI_COURSE_ID = 'rec0Zgize0c4liMl5';

type ScriptOptions = { mode: 'pg' | 'airtable'; live: boolean; confirmAirtableWrites: boolean };

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

// --mode pg writes straight to a local postgres restore (rehearsal); --mode airtable is the real
// migration (Airtable first, then pg replica). Defaults to dry-run; nothing is written without --live.
function parseArgs(argv: string[]): ScriptOptions {
  const args = argv.slice(2);
  const modeIndex = args.indexOf('--mode');
  const mode = modeIndex !== -1 ? args[modeIndex + 1] : args.find((a) => a.startsWith('--mode='))?.split('=')[1];
  if (mode !== 'pg' && mode !== 'airtable') {
    console.error('Usage: --mode <pg|airtable> [--live] [--confirm-airtable-writes]');
    process.exit(1);
  }

  return { mode, live: args.includes('--live'), confirmAirtableWrites: args.includes('--confirm-airtable-writes') };
}

function makeDb(options: ScriptOptions): PgAirtableDb {
  const pgUrl = process.env.PG_URL;
  if (!pgUrl) {
    console.error('PG_URL is not set');
    process.exit(1);
  }

  let host: string;
  try {
    host = new URL(pgUrl).hostname;
  } catch {
    host = '<unparseable>';
  }

  if (options.live && options.mode === 'pg' && !LOCAL_HOSTS.has(host)) {
    console.error(`REFUSING live pg-mode writes against non-local host "${host}" — pg mode is for local rehearsal only.`);
    process.exit(1);
  }

  if (options.live && options.mode === 'airtable' && !options.confirmAirtableWrites) {
    console.error('REFUSING to write to Airtable without --confirm-airtable-writes.');
    process.exit(1);
  }

  if (options.mode === 'airtable' && !process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN) {
    console.error('AIRTABLE_PERSONAL_ACCESS_TOKEN is not set (required for --mode airtable)');
    process.exit(1);
  }

  console.log(`mode=${options.mode} live=${options.live} pgHost=${host}`);
  return new PgAirtableDb({
    pgConnString: pgUrl,
    // In pg mode any accidental Airtable call must fail loudly rather than touch real data
    airtableApiKey: options.mode === 'airtable' ? process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN! : 'pg-mode-airtable-disabled',
  });
}

const lowerEmail = (email: string): string => email.trim().toLowerCase();

// Airtable returns transient 5xx/429s on long sequential runs; retry with backoff rather than
// crashing the whole migration. The run is idempotent, so a crash is recoverable, but this avoids it.
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await fn();
    } catch (err) {
      const status = (err as any)?.statusCode ?? (err as any)?.originalError?.statusCode;
      if (![429, 500, 502, 503, 504].includes(status) || attempt >= 6) throw err;
      const waitMs = Math.min(30000, 1000 * 2 ** (attempt - 1));
      console.log(`  retry ${attempt}/5 after ${status} (${label}); waiting ${waitMs}ms`);
      await new Promise((resolve) => {
        setTimeout(resolve, waitMs);
      });
    }
  }
}

const LEGACY_BASE_ID = 'appnJbsG1eWbAdEvf';
const LEGACY_TABLE_ID = 'tblXKnWoXK3R63F6D';

const options = parseArgs(process.argv);
const db = makeDb(options);

const ssIsAirtable = selfServeCourseRegistrationTable instanceof PgAirtableTable;
const ssPg: any = ssIsAirtable ? (selfServeCourseRegistrationTable as any).pg : selfServeCourseRegistrationTable;

// Older legacy rows predate the User-link automation backfilling userId; nothing to do about
// that here — we copy what exists.
type PlannedInsert = {
  email: string;
  userId: string | null;
  fullName: string | null;
  courseId: string;
  courseApplicationsBaseId: string | null;
  certificateId: string | null;
  certificateCreatedAt: number | null;
  source: string | null;
  createdAt: string | null;
};

async function fetchLegacyCreatedTimes(neededIds: Set<string>): Promise<Map<string, string>> {
  const created = new Map<string, string>();
  let offset: string | undefined;
  let pages = 0;
  do {
    const url = new URL(`https://api.airtable.com/v0/${LEGACY_BASE_ID}/${LEGACY_TABLE_ID}`);
    url.searchParams.set('pageSize', '100');
    url.searchParams.append('fields[]', 'Email');
    if (offset) url.searchParams.set('offset', offset);

    const body = await withRetry(async () => {
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN}` },
      });
      if (!res.ok) {
        const e = new Error(`Airtable list failed: ${res.status} ${await res.text()}`);
        (e as any).statusCode = res.status;
        throw e;
      }

      return await res.json() as { records: { id: string; createdTime: string }[]; offset?: string };
    }, `createdTimes page ${pages + 1}`);

    for (const record of body.records) {
      if (neededIds.has(record.id)) created.set(record.id, record.createdTime);
    }

    offset = body.offset;
    pages += 1;
    if (pages % 50 === 0) console.log(`  fetched ${pages} pages of createdTimes...`);
    await new Promise((resolve) => {
      setTimeout(resolve, 250);
    }); // ~4 req/s, under the 5 req/s limit
  } while (offset);

  return created;
}

async function main() {
  const legacyRows: CourseRegistration[] = await db.pg
    .select()
    .from(courseRegistrationTable.pg)
    .where(and(
      eq(courseRegistrationTable.pg.courseId, FOAI_COURSE_ID),
      eq(courseRegistrationTable.pg.decision, 'Accept'),
    ));

  const selfServeRows: any[] = await db.pg.select().from(ssPg);

  // Plan: one self-serve row per legacy CERTIFICATE (a handful of users hold several
  // certificates from duplicate registrations, and every certificate URL must keep
  // resolving), plus one row per remaining unique email.
  const toValues = (legacy: CourseRegistration): PlannedInsert => ({
    email: legacy.email,
    userId: legacy.userId,
    fullName: legacy.fullName,
    courseId: legacy.courseId,
    courseApplicationsBaseId: legacy.courseApplicationsBaseId,
    certificateId: legacy.certificateId,
    certificateCreatedAt: legacy.certificateCreatedAt,
    source: legacy.source,
    createdAt: null,
  });

  // email is now a lookup off the User link, so it can be null on rows whose user couldn't be resolved
  const coveredEmails = new Set<string>(selfServeRows.filter((r) => r.email).map((r) => lowerEmail(r.email)));
  const coveredCertIds = new Set<string>(selfServeRows.map((r) => r.certificateId).filter(Boolean));
  const healableByEmail = new Map<string, any>(selfServeRows.filter((r) => !r.certificateId && r.email).map((r) => [lowerEmail(r.email), r]));

  const inserts: { legacyId: string; values: PlannedInsert }[] = [];
  const certHeals: { selfServeId: string; certificateId: string; certificateCreatedAt: number | null }[] = [];

  const certRows = legacyRows.filter((r) => r.certificateId);
  const certlessRows = legacyRows
    .filter((r) => !r.certificateId)
    .sort((a, b) => (a.autoNumberId ?? Infinity) - (b.autoNumberId ?? Infinity));

  const multiCertEmails = new Set<string>();
  for (const row of certRows) {
    const emailKey = lowerEmail(row.email);
    if (coveredCertIds.has(row.certificateId!)) continue;
    coveredCertIds.add(row.certificateId!);

    const healable = healableByEmail.get(emailKey);
    if (healable) {
      healableByEmail.delete(emailKey);
      certHeals.push({
        selfServeId: healable.id,
        certificateId: row.certificateId!,
        certificateCreatedAt: row.certificateCreatedAt,
      });
    } else {
      if (coveredEmails.has(emailKey)) multiCertEmails.add(emailKey);
      inserts.push({ legacyId: row.id, values: toValues(row) });
    }

    coveredEmails.add(emailKey);
  }

  for (const row of certlessRows) {
    const emailKey = lowerEmail(row.email);
    if (coveredEmails.has(emailKey)) continue;
    coveredEmails.add(emailKey);
    inserts.push({ legacyId: row.id, values: toValues(row) });
  }

  if (multiCertEmails.size > 0) {
    console.log(`note: ${multiCertEmails.size} emails hold multiple certificates; backfilling one row per certificate: ${[...multiCertEmails].join(', ')}`);
  }

  console.log(`legacy FoAI Accept rows:        ${legacyRows.length} (${certRows.length} with certificates)`);
  console.log(`existing self-serve rows:       ${selfServeRows.length}`);
  console.log(`planned inserts:                ${inserts.length} (${inserts.filter((i) => i.values.certificateId).length} with certificates)`);
  console.log(`planned certificate heals:      ${certHeals.length}`);

  if (!options.live) {
    console.log('\nDRY RUN — nothing written. Sample of planned inserts:');
    for (const sample of inserts.slice(0, 5)) {
      console.log(' ', JSON.stringify(sample.values));
    }

    return;
  }

  // Original registration timestamps only exist in Airtable (the legacy table has no pg
  // createdAt column), so the rehearsal leaves createdAt null
  if (options.mode === 'airtable') {
    console.log('fetching legacy record createdTimes from Airtable...');
    const createdTimes = await fetchLegacyCreatedTimes(new Set(inserts.map((i) => i.legacyId)));
    for (const insert of inserts) {
      insert.values.createdAt = createdTimes.get(insert.legacyId) ?? null;
    }

    console.log(`  got ${createdTimes.size}/${inserts.length}`);
  }

  if (options.mode === 'pg') {
    const BATCH = 500;
    for (let i = 0; i < inserts.length; i += BATCH) {
      await db.pg.insert(ssPg).values(inserts.slice(i, i + BATCH).map((x) => x.values));
      console.log(`  inserted ${Math.min(i + BATCH, inserts.length)}/${inserts.length}`);
    }

    for (const heal of certHeals) {
      await db.pg.update(ssPg)
        .set({ certificateId: heal.certificateId, certificateCreatedAt: heal.certificateCreatedAt })
        .where(eq(ssPg.id, heal.selfServeId));
    }
  } else {
    if (!ssIsAirtable) {
      console.error('ABORT: schema still defines self_serve_course_registration as a plain pgTable; airtable mode requires the pgAirtable schema (ship PR 1).');
      process.exit(1);
    }

    let done = 0;
    for (const insert of inserts) {
      // email, fullName and courseId are Airtable lookups off the User/Course links — write only the links + writable fields
      await withRetry(() => (db.insert as any)(selfServeCourseRegistrationTable, {
        userId: insert.values.userId,
        courseApplicationsBaseId: insert.values.courseApplicationsBaseId,
        certificateId: insert.values.certificateId,
        certificateCreatedAt: insert.values.certificateCreatedAt,
        source: insert.values.source,
        createdAt: insert.values.createdAt,
      }), insert.legacyId);
      done += 1;
      if (done % 100 === 0) console.log(`  inserted ${done}/${inserts.length}`);
    }

    for (const heal of certHeals) {
      await withRetry(() => (db.update as any)(selfServeCourseRegistrationTable, {
        id: heal.selfServeId,
        certificateId: heal.certificateId,
        certificateCreatedAt: heal.certificateCreatedAt,
      }), heal.selfServeId);
    }
  }

  console.log(`DONE: ${inserts.length} inserts, ${certHeals.length} heals`);
}

main().then(() => process.exit(0)).catch((error) => {
  console.error(error);
  process.exit(1);
});
