import {
  exerciseResponseTable, exerciseTable, unitTable, userTable,
} from '@bluedot/db';
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

  test('scoped user impersonating an admin cannot read another user\'s exercise responses', async () => {
    const caller = await callerForScopedImpersonatingAdmin();
    await testDb.insert(userTable, { id: 'target-id', email: 'target@example.com', name: 'Target' });

    await expect(caller.admin.getUserExerciseResponses({ userId: 'target-id' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(caller.admin.getUserExerciseResponsesMetaInfo({ userId: 'target-id' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
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

describe('admin.getUserExerciseResponses', () => {
  // Build a target user with a mix of completed + in-progress responses across two courses.
  async function seedFixture() {
    await testDb.insert(userTable, {
      id: 'admin-id', email: 'admin@example.com', name: 'Admin', isAdmin: true,
    });
    await testDb.insert(userTable, {
      id: 'target-id', email: 'target@example.com', name: 'Target',
    });

    await testDb.insert(unitTable, {
      id: 'unit-a', courseId: 'course-a', courseTitle: 'Alignment', courseSlug: 'alignment', title: 'Intro', unitNumber: '1', unitStatus: 'Published',
    });
    await testDb.insert(unitTable, {
      id: 'unit-b', courseId: 'course-b', courseTitle: 'Governance', courseSlug: 'governance', title: 'Intro', unitNumber: '1', unitStatus: 'Published',
    });

    await testDb.insert(exerciseTable, {
      id: 'ex-a1', courseId: 'course-a', unitId: 'unit-a', title: 'A1 question', exerciseNumber: '1.1', type: 'Free text',
    });
    await testDb.insert(exerciseTable, {
      id: 'ex-a2', courseId: 'course-a', unitId: 'unit-a', title: 'A2 question', exerciseNumber: '1.2', type: 'Free text',
    });
    await testDb.insert(exerciseTable, {
      id: 'ex-b1', courseId: 'course-b', unitId: 'unit-b', title: 'B1 question', exerciseNumber: '1.1', type: 'Free text',
    });

    await testDb.insert(exerciseResponseTable, {
      id: 'resp-a1', email: 'target@example.com', exerciseId: 'ex-a1', response: 'first answer about alignment', createdAt: '2026-04-30T10:00:00Z', completedAt: '2026-05-01T10:00:00Z',
    });
    await testDb.insert(exerciseResponseTable, {
      id: 'resp-a2', email: 'target@example.com', exerciseId: 'ex-a2', response: 'second answer in progress', createdAt: '2026-05-03T10:00:00Z', completedAt: null,
    });
    await testDb.insert(exerciseResponseTable, {
      id: 'resp-b1', email: 'target@example.com', exerciseId: 'ex-b1', response: 'governance answer', createdAt: '2026-04-29T10:00:00Z', completedAt: '2026-05-02T10:00:00Z',
    });
  }

  test('regular user gets FORBIDDEN on both endpoints', async () => {
    await seedFixture();
    await testDb.insert(userTable, { id: 'regular-id', email: 'regular@example.com', name: 'Regular' });

    await expect(callerAs('regular@example.com').admin.getUserExerciseResponses({ userId: 'target-id' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
    await expect(callerAs('regular@example.com').admin.getUserExerciseResponsesMetaInfo({ userId: 'target-id' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('unknown userId returns NOT_FOUND on both endpoints', async () => {
    await seedFixture();
    await expect(callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'does-not-exist' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(callerAs('admin@example.com').admin.getUserExerciseResponsesMetaInfo({ userId: 'does-not-exist' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('context endpoint returns user + distinct courses (independent of filters)', async () => {
    await seedFixture();
    const result = await callerAs('admin@example.com').admin.getUserExerciseResponsesMetaInfo({ userId: 'target-id' });

    expect(result.user).toMatchObject({ id: 'target-id', email: 'target@example.com', name: 'Target' });
    expect(result.courses).toEqual(expect.arrayContaining([
      { id: 'course-a', title: 'Alignment' },
      { id: 'course-b', title: 'Governance' },
    ]));
    expect(result.courses).toHaveLength(2);
  });

  test('orders by COALESCE(completedAt, createdAt) so drafts mix in by start time, not always last', async () => {
    await seedFixture();
    const result = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', includeInProgress: true });

    expect(result.items).toHaveLength(3);
    // resp-a2 (in-progress, started 2026-05-03) ranks above resp-b1 (completed 2026-05-02) and resp-a1 (completed 2026-05-01).
    expect(result.items.map((i) => i.response.id)).toEqual(['resp-a2', 'resp-b1', 'resp-a1']);
    expect(result.nextCursor).toBeNull();
    // Each row includes the joined exercise + unit
    const second = result.items[1]!;
    expect(second.exercise).toMatchObject({ id: 'ex-b1', courseId: 'course-b', title: 'B1 question' });
    expect(second.unit).toMatchObject({ id: 'unit-b', courseTitle: 'Governance' });
  });

  test('courseId filter narrows items (course list lives on the context endpoint)', async () => {
    await seedFixture();
    const result = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', courseId: 'course-a', includeInProgress: true });
    expect(result.items.map((i) => i.response.id)).toEqual(['resp-a2', 'resp-a1']);
  });

  test('includeInProgress=false (default) hides drafts; true shows both', async () => {
    await seedFixture();
    const completedOnly = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id' });
    expect(completedOnly.items.map((i) => i.response.id)).toEqual(['resp-b1', 'resp-a1']);

    const all = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', includeInProgress: true });
    expect(all.items.map((i) => i.response.id)).toEqual(['resp-a2', 'resp-b1', 'resp-a1']);
  });

  test('search filters on response text (case-insensitive)', async () => {
    await seedFixture();
    const result = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', search: 'GOVERNANCE' });
    expect(result.items.map((i) => i.response.id)).toEqual(['resp-b1']);
  });

  test('search also matches exercise title (the question)', async () => {
    await seedFixture();
    // "A2 question" appears in exercise title but not in any response text
    const result = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', search: 'A2 question', includeInProgress: true });
    expect(result.items.map((i) => i.response.id)).toEqual(['resp-a2']);
  });

  test('pagination returns nextCursor when more rows exist', async () => {
    await seedFixture();
    const page1 = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', limit: 2, includeInProgress: true });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).toBe(2);

    const page2 = await callerAs('admin@example.com').admin.getUserExerciseResponses({
      userId: 'target-id', limit: 2, cursor: 2, includeInProgress: true,
    });
    expect(page2.items).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();
  });
});
