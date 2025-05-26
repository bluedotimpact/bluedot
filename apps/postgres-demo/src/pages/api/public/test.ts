import { z } from 'zod';
import { eq, userTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { db } from '../../../lib/api/db';

type TestResult = {
  testName: string;
  status: 'pass' | 'fail';
};

type TestFunction = () => Promise<TestResult>;

const testAirtableInsertAndReplication: TestFunction = async () => {
  const testName = 'Airtable Insert & Replication';
  const testEmail = `test-harness-insert-${Date.now()}@example.com`;
  const testUserName = 'Test Harness Insert User';

  const insertResult = await db.airtableInsert(userTable, {
    email: testEmail,
    name: testUserName,
  });

  const insertedRecordId = insertResult.id;

  const pgRecord = await db.pg
    .select()
    .from(userTable.pg)
    .where(eq(userTable.pg.id, insertedRecordId))
    .limit(1)
    .then((records) => records[0]);

  if (!pgRecord || pgRecord.email !== testEmail || pgRecord.name !== testUserName) {
    console.error(`[${testName}] Postgres record mismatch or not found. PG:`, pgRecord);
    return { testName, status: 'fail' };
  }
  return { testName, status: 'pass' };
};

const testAirtableUpdateAndReplication: TestFunction = async () => {
  const testName = 'Airtable Update & Replication';
  const initialEmail = `test-harness-update-${Date.now()}@example.com`;
  const initialName = 'Test Harness Update User - Initial';
  const updatedName = 'Test Harness Update User - Updated';

  const insertResult = await db.airtableInsert(userTable, {
    email: initialEmail,
    name: initialName,
  });

  if (!insertResult?.id) {
    console.error(`[${testName}] Initial insert failed.`);
    return { testName, status: 'fail' };
  }
  const recordId = insertResult.id;

  const updateResult = await db.airtableUpdate(userTable, {
    id: recordId,
    name: updatedName,
  });

  if (!updateResult || updateResult.name !== updatedName) {
    console.error(`[${testName}] Airtable update failed or did not return updated name. Result:`, updateResult);
    return { testName, status: 'fail' };
  }

  const pgRecord = await db.pg
    .select()
    .from(userTable.pg)
    .where(eq(userTable.pg.id, recordId))
    .limit(1)
    .then((records) => records[0]);

  if (!pgRecord || pgRecord.email !== initialEmail || pgRecord.name !== updatedName) {
    console.error(`[${testName}] Postgres record mismatch after update. PG:`, pgRecord);
    return { testName, status: 'fail' };
  }
  return { testName, status: 'pass' };
};

const testAirtableDeleteAndReplication: TestFunction = async () => {
  const testName = 'Airtable Delete & Replication';
  const email = `test-harness-delete-${Date.now()}@example.com`;
  const name = 'Test Harness Delete User';

  const insertResult = await db.airtableInsert(userTable, {
    email,
    name,
  });

  if (!insertResult?.id) {
    console.error(`[${testName}] Initial insert failed.`);
    return { testName, status: 'fail' };
  }
  const recordId = insertResult.id;

  const deleteResult = await db.airtableDelete(userTable, recordId);

  if (!deleteResult || deleteResult.id !== recordId) {
    console.error(`[${testName}] Airtable delete seemed to fail or returned wrong/no ID. Result:`, deleteResult);
  }

  const pgRecord = await db.pg
    .select()
    .from(userTable.pg)
    .where(eq(userTable.pg.id, recordId))
    .limit(1)
    .then((records) => records[0]);

  if (pgRecord) {
    console.error(`[${testName}] Postgres record still found after delete. PG:`, pgRecord);
    return { testName, status: 'fail' };
  }

  return { testName, status: 'pass' };
};

const testsToRun: TestFunction[] = [
  testAirtableInsertAndReplication,
  testAirtableUpdateAndReplication,
  testAirtableDeleteAndReplication,
];

export default makeApiRoute(
  {
    requireAuth: false,
    responseBody: z.array(
      z.object({
        testName: z.string(),
        status: z.enum(['pass', 'fail']),
      }),
    ),
  },
  async () => {
    const results: TestResult[] = [];
    for (const testFn of testsToRun) {
      const testNameInLoop = (testFn as any).name || testFn.constructor.name || 'Unnamed Test';
      console.log(`[Test Harness API] Running test: ${testNameInLoop}...`);
      try {
        const result = await testFn();
        results.push(result);
        console.log(`[Test Harness API] Finished test: ${result.testName}, Status: ${result.status}`);
      } catch (e: unknown) {
        const error = e as Error;
        console.error(`[Test Harness API] Outer loop caught error from test function ${testNameInLoop}:`, error.message);
        console.trace(error)
        results.push({
          testName: testNameInLoop,
          status: 'fail',
        });
      }
    }
    return results;
  },
);
