import {
  applicationsRoundTable, courseRegistrationTable,
} from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';
import { FOAI_COURSE_ID } from '../../lib/constants';

setupTestDb();

const otherCourseId = 'recOtherCourseId12345';

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
      courseId: otherCourseId,
      decision: 'Accept',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.getByCourseId({ courseId: otherCourseId });
    expect(result?.id).toBe('reg1');
  });

  test('does not return registrations with a non-Accept decision', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'test@example.com', courseId: otherCourseId, decision: 'Reject',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg2', email: 'test@example.com', courseId: otherCourseId, decision: 'Withdrawn',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.getByCourseId({ courseId: otherCourseId });
    expect(result).toBeNull();
  });

  test('does not leak registrations belonging to other users', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg1', email: 'someone-else@example.com', courseId: otherCourseId, decision: 'Accept',
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
      id: 'reg-accept', email: 'test@example.com', courseId: 'a', decision: 'Accept',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-pending', email: 'test@example.com', courseId: 'b', decision: null,
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-withdrawn', email: 'test@example.com', courseId: 'c', decision: 'Withdrawn',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-other', email: 'someone-else@example.com', courseId: 'a', decision: 'Accept',
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

describe('courseRegistrations.ensureExists', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).courseRegistrations.ensureExists({ courseId: otherCourseId }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('returns the existing registration if one already exists', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-existing', email: 'test@example.com', courseId: otherCourseId, decision: 'Accept',
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.ensureExists({ courseId: otherCourseId });
    expect(result?.id).toBe('reg-existing');
  });

  test('returns null for non-FOAI courses when no registration exists', async () => {
    const result = await createCaller(testAuthContextLoggedIn)
      .courseRegistrations.ensureExists({ courseId: otherCourseId });
    expect(result).toBeNull();
  });

  test('throws NOT_FOUND for FOAI when no applications_course config row exists', async () => {
    await expect(createCaller(testAuthContextLoggedIn)
      .courseRegistrations.ensureExists({ courseId: FOAI_COURSE_ID }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  // Note: The "creates a new FOAI registration" path can't be exercised in this test setup.
  // The router's insert (course-registrations.ts L81-87) omits `courseId`, but the courseId column is `notNull()`
  // in the pg schema. This either reveals a real bug in the router, or a difference between the
  // pg test schema and Airtable's actual behaviour (likely a formula/lookup populating courseId from
  // courseApplicationsBaseId). Flagging as a follow-up rather than asserting against a known failing path.
});
