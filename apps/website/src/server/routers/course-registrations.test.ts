import {
  applicationsRoundTable, courseRegistrationTable, selfServeCourseRegistrationTable, userTable,
} from '@bluedot/db';
import {
  beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';
import { FOAI_COURSE_ID } from '../../lib/constants';

setupTestDb();

const otherCourseId = 'recOtherCourseId12345';

// The authenticated user's row is assumed to exist by the userId-scoped routes.
beforeEach(async () => {
  await seedLoggedInUser();
});

describe('courseRegistrations.getByCourseId', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).courseRegistrations.getByCourseId({ courseId: otherCourseId })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('returns null when no matching accepted registration exists', async () => {
    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.getByCourseId({ courseId: otherCourseId });
    expect(result).toBeNull();
  });

  test('returns the accepted registration for the auth email and course', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1',
      email: 'test@example.com',
      userId: 'test-user',
      courseId: otherCourseId,
      decision: 'Accept',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.getByCourseId({ courseId: otherCourseId });
    expect(result?.id).toBe('reg1');
  });

  test('does not return registrations with a non-Accept decision', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', userId: 'test-user', courseId: otherCourseId, decision: 'Reject',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg2', email: 'test@example.com', userId: 'test-user', courseId: otherCourseId, decision: 'Withdrawn',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.getByCourseId({ courseId: otherCourseId });
    expect(result).toBeNull();
  });

  test('does not leak registrations belonging to other users', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'someone-else@example.com', userId: 'user-other', courseId: otherCourseId, decision: 'Accept',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.getByCourseId({ courseId: otherCourseId });
    expect(result).toBeNull();
  });
});

describe('courseRegistrations.getAll', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).courseRegistrations.getAll())
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('returns all non-Withdrawn registrations for the auth email, including null-decision rows', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-accept', email: 'test@example.com', userId: 'test-user', courseId: 'a', decision: 'Accept',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-pending', email: 'test@example.com', userId: 'test-user', courseId: 'b', decision: null,
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-withdrawn', email: 'test@example.com', userId: 'test-user', courseId: 'c', decision: 'Withdrawn',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-other', email: 'someone-else@example.com', userId: 'user-other', courseId: 'a', decision: 'Accept',
    });

    const result = await createCaller(testAuthContextLoggedIn).courseRegistrations.getAll();
    const ids = result.map((r) => r.id).sort();
    expect(ids).toEqual(['reg-accept', 'reg-pending']);
  });
});

describe('courseRegistrations.getRoundStartDates', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).courseRegistrations.getRoundStartDates({ roundIds: [] }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('returns an empty map when given no round ids (no DB hit)', async () => {
    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.getRoundStartDates({ roundIds: [] });
    expect(result).toEqual({});
  });

  test('returns roundId → firstDiscussionDate, including null entries', async () => {
    await testDb.insert(applicationsRoundTable, {
      id: 'round-1', firstDiscussionDate: '2026-05-01',
    });
    await testDb.insert(applicationsRoundTable, {
      id: 'round-2', firstDiscussionDate: null,
    });
    await testDb.insert(applicationsRoundTable, {
      id: 'round-3', firstDiscussionDate: '2026-06-01',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.getRoundStartDates({ roundIds: ['round-1', 'round-2'] });

    expect(result).toEqual({
      'round-1': '2026-05-01',
      'round-2': null,
    });
    expect(result['round-3']).toBeUndefined();
  });
});

// Self-serve registration behaviour is tested in self-serve-course-registrations.test.ts; here we
// only assert the backwards-compatible aliases still route to that procedure.
describe('courseRegistrations self-serve aliases', () => {
  test('ensureExists and ensureSelfServeRegistrationExists both return the self-serve registration', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-foai', email: 'test@example.com', userId: 'test-user', courseId: FOAI_COURSE_ID,
    });
    const caller = createCaller(testAuthContextLoggedIn);

    expect((await caller.courseRegistrations.ensureExists({ courseId: FOAI_COURSE_ID }))?.id).toBe('ss-foai');
    expect((await caller.courseRegistrations.ensureSelfServeRegistrationExists({ courseId: FOAI_COURSE_ID }))?.id).toBe('ss-foai');
  });
});

const TEST_TOKEN = 'test-token-secret';

const linkToUser = (input: { courseRegistrationId?: string; userId?: string; publicToken?: string }) => createCaller()
  .courseRegistrations.linkToUser({ publicToken: TEST_TOKEN, ...input });

const getRegistration = (id: string) => testDb.getFirst(courseRegistrationTable, { filter: { id } });

const countUsers = async () => (await testDb.pg.select().from(userTable.pg)).length;

// Token verification behaviour is unit-tested in lib/api/utils.test.ts
describe('courseRegistrations.linkToUser input validation', () => {
  test('throws BAD_REQUEST when both courseRegistrationId and userId are provided', async () => {
    await expect(linkToUser({ courseRegistrationId: 'reg1', userId: 'user1' }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('throws BAD_REQUEST when neither courseRegistrationId nor userId is provided', async () => {
    await expect(linkToUser({})).rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });
});

describe('courseRegistrations.linkToUser by courseRegistrationId', () => {
  test('throws NOT_FOUND for an unknown course registration', async () => {
    await expect(linkToUser({ courseRegistrationId: 'missing' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('reads the triggering registration from Airtable, not the Postgres replica', async () => {
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'new@example.com', courseId: 'c1' });
    const airtableGetSpy = vi.spyOn(testDb.airtableClient, 'get');

    const result = await linkToUser({ courseRegistrationId: 'reg1' });

    expect(result.action).toBe('created-user-and-linked');
    expect(airtableGetSpy).toHaveBeenCalledWith(courseRegistrationTable.airtable, 'reg1');
    airtableGetSpy.mockRestore();
  });

  test('leaves an already-linked registration untouched', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'someone@example.com', courseId: 'c1', userId: 'manually-set-user',
    });

    const result = await linkToUser({ courseRegistrationId: 'reg1' });

    expect(result).toEqual({ action: 'already-linked', userId: 'manually-set-user' });
    expect((await getRegistration('reg1'))?.userId).toBe('manually-set-user');
  });

  test('skips registrations without an email and does not create a user', async () => {
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: '', courseId: 'c1' });
    const usersBefore = await countUsers();

    const result = await linkToUser({ courseRegistrationId: 'reg1' });

    expect(result).toEqual({ action: 'skipped-no-email' });
    expect((await getRegistration('reg1'))?.userId).toBeNull();
    expect(await countUsers()).toBe(usersBefore);
  });

  test('links to the existing user with a matching email', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'someone@example.com', courseId: 'c1' });

    const result = await linkToUser({ courseRegistrationId: 'reg1' });

    expect(result).toEqual({ action: 'linked', userId: 'user1' });
    expect((await getRegistration('reg1'))?.userId).toBe('user1');
  });

  test('among duplicate users, links to the same row db.getFirst resolves (highest autoNumberId)', async () => {
    await testDb.insert(userTable, {
      id: 'user-old', email: 'dupe@example.com', name: 'Old', autoNumberId: 1,
    });
    await testDb.insert(userTable, {
      id: 'user-new', email: 'dupe@example.com', name: 'New', autoNumberId: 2,
    });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'dupe@example.com', courseId: 'c1' });

    const result = await linkToUser({ courseRegistrationId: 'reg1' });

    const getFirstUser = await testDb.getFirst(userTable, { filter: { email: 'dupe@example.com' } });
    expect(getFirstUser?.id).toBe('user-new');
    expect(result).toEqual({ action: 'linked', userId: 'user-new' });
    expect((await getRegistration('reg1'))?.userId).toBe('user-new');
  });

  test('matches emails case-insensitively instead of creating a duplicate user', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'Someone@Example.COM', courseId: 'c1' });
    const usersBefore = await countUsers();

    const result = await linkToUser({ courseRegistrationId: 'reg1' });

    expect(result).toEqual({ action: 'linked', userId: 'user1' });
    expect(await countUsers()).toBe(usersBefore);
  });

  test('creates a user with the name built from first and last name when none matches', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'new@example.com', courseId: 'c1', firstName: 'Ada', lastName: 'Lovelace',
    });

    const result = await linkToUser({ courseRegistrationId: 'reg1' });

    expect(result.action).toBe('created-user-and-linked');
    const user = await testDb.getFirst(userTable, { filter: { email: 'new@example.com' } });
    expect(user).toMatchObject({ name: 'Ada Lovelace' });
    expect((await getRegistration('reg1'))?.userId).toBe(user?.id);
  });

  test('creates a user with a lowercased email so website lookups can resolve it', async () => {
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'John.Doe@Example.com', courseId: 'c1' });

    const result = await linkToUser({ courseRegistrationId: 'reg1' });

    expect(result.action).toBe('created-user-and-linked');
    const user = await testDb.getFirst(userTable, { filter: { email: 'john.doe@example.com' } });
    expect(user).not.toBeNull();
    expect((await getRegistration('reg1'))?.userId).toBe(user?.id);
  });

  test('creates a user without a name (not the email fallback) when the registration has no name', async () => {
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'new@example.com', courseId: 'c1' });

    const result = await linkToUser({ courseRegistrationId: 'reg1' });

    expect(result.action).toBe('created-user-and-linked');
    const user = await testDb.getFirst(userTable, { filter: { email: 'new@example.com' } });
    expect(user?.name).toBe('');
    expect((await getRegistration('reg1'))?.userId).toBe(user?.id);
  });
});

describe('courseRegistrations.linkToUser by userId', () => {
  test('throws NOT_FOUND for an unknown user', async () => {
    await expect(linkToUser({ userId: 'missing' })).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('reads the triggering user from Airtable, not the Postgres replica', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'someone@example.com', courseId: 'c1' });
    const airtableGetSpy = vi.spyOn(testDb.airtableClient, 'get');

    const result = await linkToUser({ userId: 'user1' });

    expect(result).toEqual({ action: 'linked-user-registrations', userId: 'user1', linkedCount: 1 });
    expect(airtableGetSpy).toHaveBeenCalledWith(userTable.airtable, 'user1');
    airtableGetSpy.mockRestore();
  });

  test('links registrations when the triggering user exists in Airtable but has not synced to Postgres yet', async () => {
    const airtableGetSpy = vi.spyOn(testDb.airtableClient, 'get')
      .mockResolvedValueOnce({ id: 'user-fresh', email: 'fresh@example.com', name: 'Fresh' } as never);
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'fresh@example.com', courseId: 'c1' });

    const result = await linkToUser({ userId: 'user-fresh' });

    expect(result).toEqual({ action: 'linked-user-registrations', userId: 'user-fresh', linkedCount: 1 });
    expect((await getRegistration('reg1'))?.userId).toBe('user-fresh');
    airtableGetSpy.mockRestore();
  });

  test('links all unlinked registrations matching the user email case-insensitively', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'someone@example.com', courseId: 'c1' });
    await testDb.insert(courseRegistrationTable, { id: 'reg2', email: 'Someone@Example.COM', courseId: 'c2' });
    await testDb.insert(courseRegistrationTable, { id: 'reg3', email: 'other@example.com', courseId: 'c1' });

    const result = await linkToUser({ userId: 'user1' });

    expect(result).toEqual({ action: 'linked-user-registrations', userId: 'user1', linkedCount: 2 });
    expect((await getRegistration('reg1'))?.userId).toBe('user1');
    expect((await getRegistration('reg2'))?.userId).toBe('user1');
    expect((await getRegistration('reg3'))?.userId).toBeNull();
  });

  test('leaves already-linked registrations untouched', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'someone@example.com', courseId: 'c1', userId: 'manually-set-user',
    });

    const result = await linkToUser({ userId: 'user1' });

    expect(result).toEqual({ action: 'linked-user-registrations', userId: 'user1', linkedCount: 0 });
    expect((await getRegistration('reg1'))?.userId).toBe('manually-set-user');
  });

  test('links to the canonical duplicate even when triggered for an older duplicate user', async () => {
    await testDb.insert(userTable, {
      id: 'user-old', email: 'dupe@example.com', name: 'Old', autoNumberId: 1,
    });
    await testDb.insert(userTable, {
      id: 'user-new', email: 'dupe@example.com', name: 'New', autoNumberId: 2,
    });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: 'dupe@example.com', courseId: 'c1' });

    const result = await linkToUser({ userId: 'user-old' });

    expect(result).toEqual({ action: 'linked-user-registrations', userId: 'user-new', linkedCount: 1 });
    expect((await getRegistration('reg1'))?.userId).toBe('user-new');
  });

  test('skips users without an email instead of matching empty-email registrations', async () => {
    await testDb.insert(userTable, { id: 'user1', email: '', name: 'No Email' });
    await testDb.insert(courseRegistrationTable, { id: 'reg1', email: '', courseId: 'c1' });

    const result = await linkToUser({ userId: 'user1' });

    expect(result).toEqual({ action: 'skipped-no-email' });
    expect((await getRegistration('reg1'))?.userId).toBeNull();
  });

  test('never creates a user', async () => {
    await testDb.insert(userTable, { id: 'user1', email: 'someone@example.com', name: 'Someone' });
    const usersBefore = await countUsers();

    await linkToUser({ userId: 'user1' });

    expect(await countUsers()).toBe(usersBefore);
  });
});
