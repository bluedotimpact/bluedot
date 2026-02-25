import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { type Table, getTableName, isTable, sql } from 'drizzle-orm';
import { pushSchema } from 'drizzle-kit/api';
import { PgAirtableDb, type PgDatabase } from './client';
import { MockAirtableTs } from './mock-airtable-ts';
import { PgAirtableTable } from './db-core';
import * as schema from '../schema';

/**
 * Creates an in-memory PGlite-backed drizzle client for testing.
 * Synchronous — the client is ready for use but has no tables yet.
 * Call pushTestSchema() to create the tables.
 */
export function createTestPgClient(): PgDatabase {
  const client = new PGlite();
  return drizzle(client) as unknown as PgDatabase;
}

/**
 * Creates a test AirtableTs client backed by the same PGlite database.
 * Writes go to PG (then ensureReplicated upserts idempotently), so the mock
 * always returns full records with defaults — matching real Airtable behaviour.
 */
export function createTestAirtableClient(pgClient: PgDatabase): MockAirtableTs {
  return new MockAirtableTs(pgClient);
}

function collectPgTables() {
  return Object.fromEntries(
    Object.entries(schema)
      .filter(([, value]) => value instanceof PgAirtableTable || isTable(value))
      .map(([name, value]) => {
        if (value instanceof PgAirtableTable) {
          return [name, value.pg];
        }
        return [name, value];
      }),
  );
}

/**
 * Pushes all table schemas from @bluedot/db to the given PGlite-backed database.
 * Must be awaited before running queries against the database.
 */
export async function pushTestSchema(db: PgAirtableDb): Promise<void> {
  const pgTables = collectPgTables();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { apply } = await pushSchema(pgTables, db.pg as any);
  await apply();
}

/**
 * Truncates all tables in the test database.
 * Designed to be called in a global beforeEach so test authors don't need to
 * think about cleanup.
 */
export async function resetTestDb(db: PgAirtableDb): Promise<void> {
  const tableNames = Object.values(collectPgTables())
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((table) => getTableName(table as Table<any>));

  if (tableNames.length === 0) return;

  const quoted = tableNames.map((n) => `"${n}"`).join(', ');
  await db.pg.execute(sql.raw(`TRUNCATE ${quoted} CASCADE`));
}

/**
 * Creates an in-memory PGlite-backed PgAirtableDb for testing.
 * Convenience wrapper around createTestPgClient + pushTestSchema + PgAirtableDb.
 */
export async function createTestDb(): Promise<PgAirtableDb> {
  const pgClient = createTestPgClient();
  const db = new PgAirtableDb({
    pgClient,
    airtableClient: createTestAirtableClient(pgClient),
  });
  await pushTestSchema(db);
  return db;
}
