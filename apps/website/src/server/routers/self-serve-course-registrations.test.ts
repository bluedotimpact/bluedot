import { selfServeCourseRegistrationTable } from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
} from '../../__tests__/dbTestUtils';
import { FOAI_COURSE_ID } from '../../lib/constants';

setupTestDb();

const otherCourseId = 'recOtherCourseId12345';

describe('selfServeCourseRegistrations.ensureExists', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).selfServeCourseRegistrations.ensureExists({ courseId: FOAI_COURSE_ID }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('throws BAD_REQUEST for non-FOAI courses', async () => {
    await expect(createCaller(testAuthContextLoggedIn)
      .selfServeCourseRegistrations.ensureExists({ courseId: otherCourseId }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('returns the existing self-serve registration', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-foai', email: 'test@example.com', courseId: FOAI_COURSE_ID,
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .selfServeCourseRegistrations.ensureExists({ courseId: FOAI_COURSE_ID });
    expect(result?.id).toBe('ss-foai');
  });

  test('throws NOT_FOUND for FOAI when no applications_course config row exists', async () => {
    await expect(createCaller(testAuthContextLoggedIn)
      .selfServeCourseRegistrations.ensureExists({ courseId: FOAI_COURSE_ID }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  // The full "creates a new FOAI registration" path isn't unit-testable: the insert omits `courseId`
  // (a notNull lookup column the pg test schema rejects, populated by Airtable in prod).
});
