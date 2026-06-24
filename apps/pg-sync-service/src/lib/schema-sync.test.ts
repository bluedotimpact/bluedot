import { describe, expect, test } from 'vitest';
import {
  SafePgTable, isSchemaTable, isTable, sql,
} from '@bluedot/db';
// eslint-disable-next-line import/no-extraneous-dependencies
import { text } from 'drizzle-orm/pg-core';
import { pushSchema } from 'drizzle-kit/api';
import * as schema from '@bluedot/db/src/schema';
import { statementsRequireFullSync, cleanupRemovedColumns } from './schema-sync';
import { db } from './db';

describe('statementsRequireFullSync', () => {
  test('given no statements, returns false', () => {
    expect(statementsRequireFullSync([])).toBe(false);
  });

  test('given only a SET DEFAULT statement, returns false', () => {
    expect(statementsRequireFullSync([
      'ALTER TABLE "exercise_response" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text',
    ])).toBe(false);
  });

  test('given only a DROP DEFAULT statement, returns false', () => {
    expect(statementsRequireFullSync([
      'ALTER TABLE "exercise_response" ALTER COLUMN "id" DROP DEFAULT',
    ])).toBe(false);
  });

  test('given only SET DEFAULT statements across tables, returns false', () => {
    expect(statementsRequireFullSync([
      'ALTER TABLE "exercise_response" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text',
      'ALTER TABLE "resource_completion" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text',
    ])).toBe(false);
  });

  test('given a CREATE TABLE statement, returns true', () => {
    expect(statementsRequireFullSync([
      'CREATE TABLE "new_table" ("id" text PRIMARY KEY NOT NULL)',
    ])).toBe(true);
  });

  test('given an ADD COLUMN statement, returns true', () => {
    expect(statementsRequireFullSync([
      'ALTER TABLE "x" ADD COLUMN "y" text',
    ])).toBe(true);
  });

  test('given a mix of SET DEFAULT and ADD COLUMN, returns true', () => {
    expect(statementsRequireFullSync([
      'ALTER TABLE "exercise_response" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text',
      'ALTER TABLE "x" ADD COLUMN "y" text',
    ])).toBe(true);
  });

  // --- Adversarial cases probing for FALSE NEGATIVES (a backfill-requiring
  // statement wrongly classified as default churn) and false positives. ---

  describe('ADD COLUMN with a DEFAULT clause must still require a full sync', () => {
    // Postgres ADD COLUMN uses a bare `DEFAULT`, never `SET DEFAULT`, so the
    // regex (which requires SET/DROP immediately before DEFAULT) must not match.
    // This is the highest-risk case: a missed match here means a new column
    // never gets backfilled.
    test('ADD COLUMN ... text DEFAULT \'z\' returns true', () => {
      expect(statementsRequireFullSync([
        'ALTER TABLE "x" ADD COLUMN "y" text DEFAULT \'z\'',
      ])).toBe(true);
    });

    test('ADD COLUMN ... NOT NULL DEFAULT gen_random_uuid() returns true', () => {
      expect(statementsRequireFullSync([
        'ALTER TABLE "x" ADD COLUMN "y" text NOT NULL DEFAULT gen_random_uuid()',
      ])).toBe(true);
    });
  });

  test('CREATE TABLE whose body contains a DEFAULT clause returns true', () => {
    expect(statementsRequireFullSync([
      'CREATE TABLE "new_table" ("id" text PRIMARY KEY NOT NULL DEFAULT gen_random_uuid()::text, "n" integer DEFAULT 0)',
    ])).toBe(true);
  });

  describe('identifiers containing the substring "default" must not be misclassified as churn', () => {
    // The regex anchors on whitespace before SET/DROP and a word boundary after
    // DEFAULT, so a column/table whose *name* contains the word should not be
    // mistaken for a `SET DEFAULT` / `DROP DEFAULT` churn statement.
    test('ADD COLUMN on a column literally named "set_default" returns true', () => {
      expect(statementsRequireFullSync([
        'ALTER TABLE "x" ADD COLUMN "set_default" text',
      ])).toBe(true);
    });

    test('ADD COLUMN on a table literally named "default_settings" returns true', () => {
      expect(statementsRequireFullSync([
        'ALTER TABLE "default_settings" ADD COLUMN "y" text',
      ])).toBe(true);
    });
  });

  describe('whitespace / casing variants of the churn pattern', () => {
    // Drizzle-kit emits canonical single-space, uppercase `SET DEFAULT` (see the
    // real-output integration test below). These assert the regex's behaviour on
    // off-canonical spacing so that any future change in drizzle's formatting
    // would surface here rather than silently flipping the classification.
    test('lowercase "set default" is still treated as churn (returns false)', () => {
      expect(statementsRequireFullSync([
        'ALTER TABLE "x" ALTER COLUMN "id" set default gen_random_uuid()::text',
      ])).toBe(false);
    });

    test('a newline between SET and DEFAULT is still treated as churn (returns false)', () => {
      expect(statementsRequireFullSync([
        'ALTER TABLE "x" ALTER COLUMN "id" SET\nDEFAULT 1',
      ])).toBe(false);
    });

    test('multiple spaces between SET and DEFAULT are NOT matched, so it errs toward a full sync (returns true)', () => {
      // `\s` matches a single whitespace char, so `SET  DEFAULT` does not match.
      // This is the safe direction: an unrecognised statement triggers a full
      // sync rather than risking a missed backfill. Drizzle does not emit this
      // form in practice, so it has no real-world cost.
      expect(statementsRequireFullSync([
        'ALTER TABLE "x" ALTER COLUMN "id" SET  DEFAULT 1',
      ])).toBe(true);
    });
  });
});

describe('statementsRequireFullSync against real drizzle-kit push output', () => {
  // The global beforeAll (src/test-setup.ts) has already pushed the full schema
  // to the in-memory PGlite DB. Drizzle-kit's pushSchema is non-idempotent for
  // certain defaults (notably `gen_random_uuid()::text` and numeric defaults):
  // re-pushing an *unchanged* schema re-emits `SET DEFAULT` statements every
  // time. This is the exact churn the fix exists to ignore. We re-push here and
  // assert that the churn does NOT trigger a full sync — guarding the regex
  // against drift in drizzle's real output format, not just hand-written strings.
  test('re-pushing the unchanged schema produces only default churn and requires no full sync', async () => {
    const pgTables = Object.fromEntries(Object.entries(schema)
      .filter(([, value]) => isSchemaTable(value) || isTable(value))
      .map(([name, value]) => [
        name,
        isSchemaTable(value) ? (value.pgWithDeprecatedColumns ?? value.pg) : value,
      ]));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await pushSchema(pgTables as any, db.pg as any);

    // Sanity: this test only means something if drizzle is actually re-emitting
    // churn. If drizzle ever becomes idempotent here the list is empty, which
    // also (correctly) requires no full sync.
    if (result.statementsToExecute.length > 0) {
      // Every churn statement must be a SET/DROP DEFAULT.
      for (const statement of result.statementsToExecute) {
        expect(statement).toMatch(/\s(SET|DROP)\sDEFAULT\b/i);
      }
    }

    expect(statementsRequireFullSync(result.statementsToExecute)).toBe(false);
  });
});

describe('cleanupRemovedColumns and SafePgTable deprecated columns', () => {
  // A SafePgTable keeps deprecated columns out of `.pg` (active) but present in
  // `.pgWithDeprecatedColumns`. runDrizzlePush feeds the with-deprecated variant to
  // cleanupRemovedColumns, so the deprecated column must survive — that's the whole
  // point of the wrapper (a still-released consumer keeps SELECTing it). To isolate
  // this from the shared schema, we create a throwaway physical table directly.
  const createPhysicalTable = async (): Promise<void> => {
    await db.pg.execute(sql`DROP TABLE IF EXISTS safe_pg_cleanup_test`);
    await db.pg.execute(sql`CREATE TABLE safe_pg_cleanup_test ("active" text, "legacy" text)`);
  };

  const getColumns = async (): Promise<Set<string>> => {
    const cols = await db.pg.execute(sql`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'safe_pg_cleanup_test' AND table_schema = 'public'
    `);
    return new Set(cols.rows.map((row: { column_name: string }) => row.column_name));
  };

  test('keeps the deprecated column when given the with-deprecated variant', async () => {
    const table = new SafePgTable('safe_pg_cleanup_test', {
      columns: { active: text() },
      deprecatedColumns: { legacy: text() },
    });
    await createPhysicalTable();

    await cleanupRemovedColumns({ table: table.pgWithDeprecatedColumns! });

    const colNames = await getColumns();
    expect(colNames.has('active')).toBe(true);
    expect(colNames.has('legacy')).toBe(true);

    await db.pg.execute(sql`DROP TABLE IF EXISTS safe_pg_cleanup_test`);
  });

  test('drops the deprecated column if only the active variant is passed (proving the variant matters)', async () => {
    const table = new SafePgTable('safe_pg_cleanup_test', {
      columns: { active: text() },
      deprecatedColumns: { legacy: text() },
    });
    await createPhysicalTable();

    await cleanupRemovedColumns({ table: table.pg });

    const colNames = await getColumns();
    expect(colNames.has('active')).toBe(true);
    expect(colNames.has('legacy')).toBe(false);

    await db.pg.execute(sql`DROP TABLE IF EXISTS safe_pg_cleanup_test`);
  });
});
