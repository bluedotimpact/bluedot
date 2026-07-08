import {
  resourceCompletionPgTable,
  unitResourceTable,
  userTable,
} from '@bluedot/db';
import {
  beforeEach, describe, expect, test,
} from 'vitest';
import {
  createCaller,
  setupTestDb,
  testAuthContextLoggedIn,
  testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

// The authenticated user's row is assumed to exist by the userId-scoped routes.
beforeEach(async () => {
  await testDb.insert(userTable, { id: 'user-1', email: CALLER_EMAIL, name: 'Test User' });
});

describe('resources.saveResourceCompletion', () => {
  test('writes resourceId and userId on insert when they can be resolved', async () => {
    await testDb.insert(unitResourceTable, { id: 'ur-1', resourceId: ['resource-1'] });

    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-1',
      isCompleted: true,
    });

    expect(result).toMatchObject({
      unitResourceId: 'ur-1',
      resourceId: ['resource-1'],
      userId: ['user-1'],
    });
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('leaves resourceId null when the resource lookup misses', async () => {
    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-missing',
      isCompleted: true,
    });

    expect(result.resourceId).toBeNull();
    expect(result.userId).toEqual(['user-1']);
  });

  test('throws UNAUTHORIZED when the user row is missing', async () => {
    const noUserCaller = createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, email: 'nouser@example.com' },
    });

    await expect(noUserCaller.resources.saveResourceCompletion({
      unitResourceId: 'ur-1',
      isCompleted: true,
    })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('updates an existing completion without touching the FK fields', async () => {
    await testDb.pg.insert(resourceCompletionPgTable.pg).values({
      id: 'rc-1',
      email: CALLER_EMAIL,
      unitResourceId: 'ur-1',
      resourceId: ['resource-original'],
      userId: ['user-1'],
    });

    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-1',
      isCompleted: true,
    });

    expect(result).toMatchObject({
      id: 'rc-1',
      resourceId: ['resource-original'],
      userId: ['user-1'],
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
      userId: ['user-1'],
      unitResourceId: 'ur-1',
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
      userId: ['user-1'],
      unitResourceId: 'ur-1',
      completedAt: '2026-01-01T00:00:00.000Z',
    });

    const result = await caller.resources.saveResourceCompletion({
      unitResourceId: 'ur-1',
      feedback: 'some feedback',
    });

    expect(result.completedAt).toBe('2026-01-01T00:00:00.000Z');
  });
});
