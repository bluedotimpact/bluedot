// @vitest-environment node
import {
  afterAll, expect, test, vi,
} from 'vitest';
import { PgAirtableDb } from '@bluedot/db';

// eslint-disable-next-line turbo/no-undeclared-env-vars -- Optional local integration test, invoked directly without Turbo caching.
const { testUrl } = vi.hoisted(() => ({ testUrl: process.env.SCOUT_TEST_PG_URL }));
// Refuse to use a production database for this opt-in integration test.
if (testUrl && new URL(testUrl).hostname !== '127.0.0.1') throw new Error('SCOUT_TEST_PG_URL must use 127.0.0.1');
const clients: PgAirtableDb[] = [];
vi.mock('../../../lib/api/db', () => {
  const db = new PgAirtableDb({ pgConnString: testUrl ?? '', airtableApiKey: 'synthetic-only' });
  clients.push(db);
  return { default: db };
});

afterAll(async () => {
  await Promise.all(clients.map((client) => client.pg.$client.end()));
});

test.skipIf(!testUrl)('concurrent transactions for one participant recheck state after the first decision', async () => {
  const { withDecisionLock } = await import('./decisionLock');
  let stored: string | undefined;
  let writes = 0;
  const decide = (value: string) => withDecisionLock('synthetic-scout-concurrency', async () => {
    if (stored) return false;
    await new Promise((resolve) => {
      setTimeout(resolve, 30);
    });
    stored = value;
    writes += 1;
    return true;
  });
  const results = await Promise.all([decide('invite'), decide('decline'), decide('invite')]);
  expect(results.filter(Boolean)).toHaveLength(1);
  expect(writes).toBe(1);
});

test.skipIf(!testUrl)('failure releases the transaction lock so a later retry can proceed', async () => {
  const { withDecisionLock } = await import('./decisionLock');
  await expect(withDecisionLock('synthetic-scout-failure', async () => {
    throw new Error('Synthetic write failure');
  })).rejects.toThrow('Synthetic write failure');
  await expect(withDecisionLock('synthetic-scout-failure', async () => 'retried')).resolves.toBe('retried');
});
