import { userTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import {
  describe, expect, test,
} from 'vitest';
import {
  setupTestDb, createCaller, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const callerAs = (email: string) => createCaller({
  ...testAuthContextLoggedIn,
  auth: { ...testAuthContextLoggedIn.auth!, email },
});

describe('impersonation.searchTargets', () => {
  test('scoped user only sees allowed targets', async () => {
    await testDb.insert(userTable, {
      id: 'scoped-id', email: 'scoped@example.com', name: 'Scoped', allowedImpersonationTargets: ['user-1'],
    });
    await testDb.insert(userTable, { id: 'user-1', email: 'alice@example.com', name: 'Alice' });
    await testDb.insert(userTable, { id: 'user-2', email: 'bob@example.com', name: 'Bob' });

    const results = await callerAs('scoped@example.com').impersonation.searchTargets({});
    expect(results).toHaveLength(1);
    expect(results[0]!.email).toBe('alice@example.com');
  });

  test('regular user gets FORBIDDEN', async () => {
    await testDb.insert(userTable, { id: 'regular-id', email: 'regular@example.com', name: 'Regular' });

    await expect(callerAs('regular@example.com').impersonation.searchTargets({})).rejects.toThrow(TRPCError);
  });
});
