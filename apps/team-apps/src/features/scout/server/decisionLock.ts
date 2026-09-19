import { sql } from '@bluedot/db';
import db from '../../../lib/api/db';

// A transaction-scoped lock coordinates all portal workers without a new table.
// Airtable is re-read while the lock is held; no replicated status is trusted.
export const withDecisionLock = <T>(id: string, decide: () => Promise<T>): Promise<T> => db.pg.transaction(async (tx) => {
  await tx.execute(sql`SET LOCAL lock_timeout = '10s'`);
  await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${`scout:${id}`}, 0))`);
  return decide();
});
