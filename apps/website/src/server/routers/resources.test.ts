import {
  courseBuilderUserTable,
  resourceCompletionPgTable,
  unitResourceTable,
} from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import {
  createCaller,
  setupTestDb,
  testAuthContextLoggedIn,
  testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

describe('resources.saveResourceCompletion', () => {
  test('writes resourceId and createdByUserId on insert when both can be resolved', async () => {
    await testDb.insert(courseBuilderUserTable, { id: 'cb-user-1', email: CALLER_EMAIL });
    await testDb.insert(unitResourceTable, { id: 'ur-1', resourceId: ['resource-1'] });

    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-1',
      isCompleted: true,
    });

    expect(result).toMatchObject({
      unitResourceId: 'ur-1',
      isCompleted: true,
      resourceId: ['resource-1'],
      createdByUserId: ['cb-user-1'],
    });
  });

  test('leaves the FK fields null on insert when the lookups miss', async () => {
    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-missing',
      isCompleted: true,
    });

    expect(result.resourceId).toBeNull();
    expect(result.createdByUserId).toBeNull();
  });

  test('updates an existing completion without touching the FK fields', async () => {
    await testDb.pg.insert(resourceCompletionPgTable).values({
      id: 'rc-1',
      email: CALLER_EMAIL,
      unitResourceId: 'ur-1',
      isCompleted: false,
      resourceId: ['resource-original'],
      createdByUserId: ['cb-user-original'],
    });

    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-1',
      isCompleted: true,
    });

    expect(result).toMatchObject({
      id: 'rc-1',
      isCompleted: true,
      resourceId: ['resource-original'],
      createdByUserId: ['cb-user-original'],
    });
  });
});
