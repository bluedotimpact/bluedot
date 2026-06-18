import { beforeAll, beforeEach } from 'vitest';
import {
  createTestDbClients, PgAirtableDb, pushTestSchema, resetTestDb, type TestPgAirtableDb,
} from '@bluedot/db';

const { pgClient, airtableClient } = createTestDbClients();

export const db = new PgAirtableDb({
  pgConnString: 'unused', airtableApiKey: 'unused', pgClient, airtableClient,
});

// Same instance, with the widened insert type that accepts an explicit `id` for setting up test data.
export const testDb = db as unknown as TestPgAirtableDb;

/** Call once per test file that touches the database. */
export function setupTestDb() {
  beforeAll(async () => {
    await pushTestSchema(db);
  });
  beforeEach(async () => {
    await resetTestDb(db);
  });
}
