import { applicationsCourseTable, selfServeCourseRegistrationTable } from '@bluedot/db';
import {
  describe, expect, test, vi,
} from 'vitest';
import db from '../../lib/api/db';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testAuthContextLoggedOut, testDb,
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
    await seedLoggedInUser();
    await expect(createCaller(testAuthContextLoggedIn)
      .selfServeCourseRegistrations.ensureExists({ courseId: otherCourseId }))
      .rejects.toMatchObject({ code: 'BAD_REQUEST' });
  });

  test('returns the existing self-serve registration', async () => {
    await seedLoggedInUser();
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-foai', userId: 'test-user', courseId: FOAI_COURSE_ID,
    });

    const result = await createCaller(testAuthContextLoggedIn)
      .selfServeCourseRegistrations.ensureExists({ courseId: FOAI_COURSE_ID });
    expect(result?.id).toBe('ss-foai');
  });

  test('throws NOT_FOUND for FOAI when no applications_course config row exists', async () => {
    await seedLoggedInUser();
    await expect(createCaller(testAuthContextLoggedIn)
      .selfServeCourseRegistrations.ensureExists({ courseId: FOAI_COURSE_ID }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  test('throws UNAUTHORIZED for FOAI when the authenticated caller has no User record', async () => {
    await expect(createCaller(testAuthContextLoggedIn)
      .selfServeCourseRegistrations.ensureExists({ courseId: FOAI_COURSE_ID }))
      .rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('writes the UTM params onto a new registration', async () => {
    await seedLoggedInUser();
    await testDb.insert(applicationsCourseTable, { id: 'app-course-foai', courseBuilderId: FOAI_COURSE_ID });
    // The real insert can't run here: it omits `courseId`, a notNull lookup column populated by Airtable in prod
    const insertSpy = vi.spyOn(db, 'insert').mockResolvedValue({ id: 'ss-new' } as never);

    await createCaller(testAuthContextLoggedIn).selfServeCourseRegistrations.ensureExists({
      courseId: FOAI_COURSE_ID,
      source: 'newsletter',
      utmCampaign: 'spring-launch',
      utmContent: 'hero-cta',
    });

    expect(insertSpy).toHaveBeenCalledWith(selfServeCourseRegistrationTable, expect.objectContaining({
      source: 'newsletter',
      utmCampaign: 'spring-launch',
      utmContent: 'hero-cta',
    }));
    insertSpy.mockRestore();
  });

  test('writes nulls when no UTM params are supplied', async () => {
    await seedLoggedInUser();
    await testDb.insert(applicationsCourseTable, { id: 'app-course-foai', courseBuilderId: FOAI_COURSE_ID });
    const insertSpy = vi.spyOn(db, 'insert').mockResolvedValue({ id: 'ss-new' } as never);

    await createCaller(testAuthContextLoggedIn).selfServeCourseRegistrations.ensureExists({ courseId: FOAI_COURSE_ID });

    expect(insertSpy).toHaveBeenCalledWith(selfServeCourseRegistrationTable, expect.objectContaining({
      source: null,
      utmCampaign: null,
      utmContent: null,
    }));
    insertSpy.mockRestore();
  });
});
