import {
  exerciseResponseTable, exerciseTable, unitTable, userTable,
} from '@bluedot/db';
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
      id: 'resp-a1', email: 'target@example.com', exerciseId: 'ex-a1', response: 'first answer about alignment', completedAt: '2026-05-01T10:00:00Z',
    });
    await testDb.insert(exerciseResponseTable, {
      id: 'resp-a2', email: 'target@example.com', exerciseId: 'ex-a2', response: 'second answer in progress', completedAt: null,
    });
    await testDb.insert(exerciseResponseTable, {
      id: 'resp-b1', email: 'target@example.com', exerciseId: 'ex-b1', response: 'governance answer', completedAt: '2026-05-02T10:00:00Z',
    });
  }

  test('regular user gets FORBIDDEN', async () => {
    await seedFixture();
    await testDb.insert(userTable, { id: 'regular-id', email: 'regular@example.com', name: 'Regular' });

    await expect(callerAs('regular@example.com').admin.getUserExerciseResponses({ userId: 'target-id' }))
      .rejects.toMatchObject({ code: 'FORBIDDEN' });
  });

  test('unknown userId returns NOT_FOUND', async () => {
    await seedFixture();
    await expect(callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'does-not-exist' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('returns all responses for the target user, newest completedAt first, nulls last', async () => {
    await seedFixture();
    const result = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id' });

    expect(result.user).toMatchObject({ id: 'target-id', email: 'target@example.com', name: 'Target' });
    expect(result.items).toHaveLength(3);
    // Newest completedAt first (resp-b1 2026-05-02 > resp-a1 2026-05-01), then in-progress (resp-a2) last
    expect(result.items.map((i) => i.response.id)).toEqual(['resp-b1', 'resp-a1', 'resp-a2']);
    expect(result.nextCursor).toBeNull();
    // Each row includes the joined exercise + unit
    const first = result.items[0]!;
    expect(first.exercise).toMatchObject({ id: 'ex-b1', courseId: 'course-b', title: 'B1 question' });
    expect(first.unit).toMatchObject({ id: 'unit-b', courseTitle: 'Governance' });
  });

  test('lists distinct courses the user has responded in, regardless of current filter', async () => {
    await seedFixture();
    const result = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', courseId: 'course-a' });

    expect(result.courses).toEqual(expect.arrayContaining([
      { id: 'course-a', title: 'Alignment' },
      { id: 'course-b', title: 'Governance' },
    ]));
    expect(result.courses).toHaveLength(2);
    // courseId filter still narrows items
    expect(result.items.map((i) => i.response.id)).toEqual(['resp-a1', 'resp-a2']);
  });

  test('status filter narrows to completed or in-progress', async () => {
    await seedFixture();
    const completed = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', status: 'completed' });
    expect(completed.items.map((i) => i.response.id)).toEqual(['resp-b1', 'resp-a1']);

    const inProgress = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', status: 'in-progress' });
    expect(inProgress.items.map((i) => i.response.id)).toEqual(['resp-a2']);
  });

  test('search filters on response text (case-insensitive)', async () => {
    await seedFixture();
    const result = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', search: 'GOVERNANCE' });
    expect(result.items.map((i) => i.response.id)).toEqual(['resp-b1']);
  });

  test('search also matches exercise title (the question)', async () => {
    await seedFixture();
    // "A2 question" appears in exercise title but not in any response text
    const result = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', search: 'A2 question' });
    expect(result.items.map((i) => i.response.id)).toEqual(['resp-a2']);
  });

  test('pagination returns nextCursor when more rows exist', async () => {
    await seedFixture();
    const page1 = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', limit: 2 });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).toBe(2);

    const page2 = await callerAs('admin@example.com').admin.getUserExerciseResponses({ userId: 'target-id', limit: 2, cursor: 2 });
    expect(page2.items).toHaveLength(1);
    expect(page2.nextCursor).toBeNull();
  });
});
