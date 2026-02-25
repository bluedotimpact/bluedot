import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { isTable } from 'drizzle-orm';
import { pushSchema } from 'drizzle-kit/api';
import { PgAirtableDb, type PgDatabase } from './client';
import { MockStatelessAirtableTs } from './mock-airtable-ts';
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
 * Creates a stateless mock AirtableTs client for testing.
 */
export function createTestAirtableClient(): MockStatelessAirtableTs {
  return new MockStatelessAirtableTs();
}

/**
 * Pushes all table schemas from @bluedot/db to the given PGlite-backed client.
 * Must be awaited before running queries against the database.
 */
export async function pushTestSchema(pgClient: PgDatabase): Promise<void> {
  // Collect all pg tables from the schema:
  // - PgAirtableTable instances: extract the .pg drizzle table
  // - Plain pgTable instances: use directly (detected via drizzle's isTable)
  const pgTables = Object.fromEntries(
    Object.entries(schema)
      .filter(([, value]) => value instanceof PgAirtableTable || isTable(value))
      .map(([name, value]) => {
        if (value instanceof PgAirtableTable) {
          return [name, value.pg];
        }
        return [name, value];
      }),
  );

  const { apply } = await pushSchema(pgTables, pgClient);
  await apply();
}

/**
 * Creates an in-memory PGlite-backed PgAirtableDb for testing.
 * Convenience wrapper around createTestPgClient + pushTestSchema + PgAirtableDb.
 */
export async function createTestDb(): Promise<PgAirtableDb> {
  const pgClient = createTestPgClient();
  await pushTestSchema(pgClient);
  return new PgAirtableDb({
    pgClient,
    airtableClient: createTestAirtableClient(),
  });
}
