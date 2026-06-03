import { userTable } from '@bluedot/db';
import {
  describe, expect, test,
} from 'vitest';
import {
  setupTestDb, createCaller, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const callerAs = (email: string) => createCaller({
  ...testAuthContextLoggedIn,
  auth: { ...testAuthContextLoggedIn.auth!, email },
});

describe('admin: privilege escalation prevention', () => {
  // Set up a scoped impersonator targeting an admin, then run their assertions through
  // the caller built for that impersonation. Every admin-gated procedure should refuse.
  async function callerForScopedImpersonatingAdmin() {
    await testDb.insert(userTable, {
      id: 'scoped-id', email: 'scoped@example.com', name: 'Scoped', allowedImpersonationTargets: ['admin-id'],
    });
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true,
    });
    return createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, email: 'admin@example.com' },
      impersonation: { adminEmail: 'scoped@example.com', targetEmail: 'admin@example.com' },
    });
  }

  test('scoped user impersonating an admin cannot access syncHistory', async () => {
    const caller = await callerForScopedImpersonatingAdmin();
    await expect(caller.admin.syncHistory()).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('scoped user impersonating an admin: isUserAdmin returns false', async () => {
    const caller = await callerForScopedImpersonatingAdmin();
    expect(await caller.admin.isUserAdmin()).toBe(false);
  });

  test('scoped user impersonating an admin cannot search with scope=all', async () => {
    const caller = await callerForScopedImpersonatingAdmin();
    await expect(caller.admin.searchUsers({ scope: 'all' })).rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

describe('admin.isUserAdmin', () => {
  test('logged-out → false (does not throw)', async () => {
    const caller = createCaller(testAuthContextLoggedOut);
    expect(await caller.admin.isUserAdmin()).toBe(false);
  });

  test('regular user → false', async () => {
    await testDb.insert(userTable, { id: 'regular-id', email: 'regular@example.com', name: 'Regular' });
    expect(await callerAs('regular@example.com').admin.isUserAdmin()).toBe(false);
  });

  test('admin → true', async () => {
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true,
    });
    expect(await callerAs('admin@example.com').admin.isUserAdmin()).toBe(true);
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

  test('scope=all: non-admin gets FORBIDDEN even if they have scoped impersonation access', async () => {
    await testDb.insert(userTable, {
      id: 'scoped-id', email: 'scoped@example.com', name: 'Scoped', allowedImpersonationTargets: ['user-1'],
    });
    await testDb.insert(userTable, { id: 'user-1', email: 'alice@example.com', name: 'Alice' });

    await expect(callerAs('scoped@example.com').admin.searchUsers({ scope: 'all' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });
});

