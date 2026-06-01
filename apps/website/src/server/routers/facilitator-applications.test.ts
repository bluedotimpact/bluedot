import { applicationsRoundTable, courseRegistrationTable, courseTable } from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import {
  createCaller, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

describe('facilitatorApplications.list', () => {
  test('returns empty array when caller has no facilitator registrations', async () => {
    const result = await caller.facilitatorApplications.list();
    expect(result).toEqual([]);
  });

  test('excludes participant registrations', async () => {
    await testDb.insert(courseTable, {
      id: 'course-1',
      slug: 'tai-safety',
      title: 'Technical AI Safety',
      shortDescription: 's',
      units: [],
      status: 'Active',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-p',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Participant',
      decision: 'Accept',
      roundStatus: 'Active',
    });
    const result = await caller.facilitatorApplications.list();
    expect(result).toEqual([]);
  });

  test('joins course + round metadata onto each facilitator registration', async () => {
    await testDb.insert(courseTable, {
      id: 'course-1',
      slug: 'tai-safety',
      title: 'Technical AI Safety',
      shortDescription: 's',
      units: [],
      status: 'Active',
    });
    await testDb.insert(applicationsRoundTable, {
      id: 'round-1',
      firstDiscussionDate: '2026-03-10',
      lastDiscussionDate: '2026-03-17',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      decision: 'Accept',
      roundStatus: 'Future',
      roundId: 'round-1',
      roundName: 'Week 19 Intensive',
      availabilityIntervalsUTC: 'M16:00 M18:00',
    });

    const result = await caller.facilitatorApplications.list();
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 'reg-1',
      courseId: 'course-1',
      courseTitle: 'Technical AI Safety',
      courseSlug: 'tai-safety',
      roundId: 'round-1',
      roundName: 'Week 19 Intensive',
      roundFirstDiscussionDate: '2026-03-10',
      roundLastDiscussionDate: '2026-03-17',
      decision: 'Accept',
      roundStatus: 'Future',
      hasAvailability: true,
    });
  });

  test('includes withdrawn registrations', async () => {
    await testDb.insert(courseTable, {
      id: 'course-1',
      slug: 'tai-safety',
      title: 'Technical AI Safety',
      shortDescription: 's',
      units: [],
      status: 'Active',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-w',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      decision: 'Withdrawn',
      roundStatus: 'Future',
    });
    const result = await caller.facilitatorApplications.list();
    expect(result.map((r) => r.id)).toEqual(['reg-w']);
  });

  test('does not return another user\'s registrations', async () => {
    await testDb.insert(courseTable, {
      id: 'course-1',
      slug: 'tai-safety',
      title: 'Technical AI Safety',
      shortDescription: 's',
      units: [],
      status: 'Active',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-other',
      email: 'other@example.com',
      courseId: 'course-1',
      role: 'Facilitator',
      decision: 'Accept',
      roundStatus: 'Active',
    });
    const result = await caller.facilitatorApplications.list();
    expect(result).toEqual([]);
  });
});
