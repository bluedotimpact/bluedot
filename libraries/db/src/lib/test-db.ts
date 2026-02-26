// eslint-disable-next-line import/no-extraneous-dependencies
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import {
  type Table, getTableName, isTable, sql,
} from 'drizzle-orm';
// eslint-disable-next-line import/no-extraneous-dependencies
import { pushSchema } from 'drizzle-kit/api';
import { type PgAirtableDb, type PgDatabase } from './client';
import { MockAirtableTs } from './mock-airtable-ts';
import { PgAirtableTable } from './db-core';
import type { PgAirtableColumnInput, AirtableItemFromColumnsMap, BasePgTableType } from './typeUtils';
import * as schema from '../schema';

/**
 * Creates an in-memory PGlite-backed drizzle client for testing.
 * The client is ready for use but has no tables yet.
 * Call pushTestSchema() to create the tables, this can be done per-test-file.
 */
export function createTestPgClient(): PgDatabase {
  const client = new PGlite();
  return drizzle(client);
}

/**
 * Creates a test AirtableTs client backed by the same PGlite database.
 */
export function createTestAirtableClient(pgClient: PgDatabase): MockAirtableTs {
  return new MockAirtableTs(pgClient);
}

export function createTestDbClients() {
  const pgClient = createTestPgClient();
  const airtableClient = createTestAirtableClient(pgClient);
  return { pgClient, airtableClient };
}

function collectPgTables() {
  return Object.fromEntries(Object.entries(schema)
    .filter(([, value]) => value instanceof PgAirtableTable || isTable(value))
    .map(([name, value]) => {
      if (value instanceof PgAirtableTable) {
        return [name, value.pg];
      }

      return [name, value];
    }));
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
 * Test-only variant of PgAirtableDb that allows passing an explicit `id` when inserting.
 */
export type TestPgAirtableDb = {
  insert<TTableName extends string, TColumnsMap extends Record<string, PgAirtableColumnInput>>(
    table: PgAirtableTable<TTableName, TColumnsMap>,
    data: Partial<Omit<AirtableItemFromColumnsMap<TColumnsMap>, 'id'>> & { id?: string },
  ): Promise<BasePgTableType<TTableName, TColumnsMap>['$inferSelect']>;
} & Omit<PgAirtableDb, 'insert'>;
