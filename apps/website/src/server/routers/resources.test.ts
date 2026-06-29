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
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
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
    await testDb.pg.insert(resourceCompletionPgTable.pg).values({
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

  test('sets completedAt when isCompleted is true', async () => {
    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-1',
      isCompleted: true,
    });

    expect(result.completedAt).toBeTruthy();
    expect(new Date(result.completedAt!).getTime()).not.toBeNaN();
  });

  test('clears completedAt when isCompleted is false', async () => {
    await testDb.pg.insert(resourceCompletionPgTable.pg).values({
      id: 'rc-1',
      email: CALLER_EMAIL,
      unitResourceId: 'ur-1',
      isCompleted: true,
      completedAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-1',
      isCompleted: false,
    });

    expect(result.completedAt).toBeNull();
  });

  test('preserves completedAt when isCompleted is omitted', async () => {
    await testDb.pg.insert(resourceCompletionPgTable.pg).values({
      id: 'rc-1',
      email: CALLER_EMAIL,
      unitResourceId: 'ur-1',
      isCompleted: true,
      completedAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-1',
      feedback: 'some feedback',
    });

    expect(result.completedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
