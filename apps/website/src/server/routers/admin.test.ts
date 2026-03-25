import { userTable } from '@bluedot/db';
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

describe('admin: privilege escalation prevention', () => {
  test('scoped user impersonating an admin cannot access admin-only endpoints', async () => {
    await testDb.insert(userTable, {
      id: 'scoped-id', email: 'scoped@example.com', name: 'Scoped', allowedImpersonationTargets: ['admin-id'],
    });
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true,
    });

    // Simulate scoped user impersonating an admin: auth.email is the target (admin), impersonation tracks the real user
    const caller = createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, email: 'admin@example.com' },
      impersonation: { adminEmail: 'scoped@example.com', targetEmail: 'admin@example.com' },
    });

    await expect(caller.admin.syncHistory()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('admin.searchUsers', () => {
  test('scoped user only sees allowed targets', async () => {
    await testDb.insert(userTable, {
      id: 'scoped-id', email: 'scoped@example.com', name: 'Scoped', allowedImpersonationTargets: ['user-1'],
    });
    await testDb.insert(userTable, { id: 'user-1', email: 'alice@example.com', name: 'Alice' });
    await testDb.insert(userTable, { id: 'user-2', email: 'bob@example.com', name: 'Bob' });

    const results = await callerAs('scoped@example.com').admin.searchUsers({});
    expect(results).toHaveLength(1);
    expect(results[0]!.email).toBe('alice@example.com');
  });

  test('regular user gets FORBIDDEN', async () => {
    await testDb.insert(userTable, { id: 'regular-id', email: 'regular@example.com', name: 'Regular' });

    await expect(callerAs('regular@example.com').admin.searchUsers({})).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});
