import {
  courseRegistrationTable,
  courseTable,
  groupDiscussionTable,
  meetPersonTable,
} from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import {
  createCaller,
  setupTestDb,
  testAuthContextLoggedIn,
  testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

describe('groupDiscussions.getByCourseSlug', () => {
  test('uses expected facilitator discussion ids when indirect round linkage misses the upcoming session', async () => {
    const futureStartTimeSecs = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
    const futureEndTimeSecs = futureStartTimeSecs + (60 * 60);

    await testDb.insert(courseTable, {
      id: 'course-1',
      slug: 'technical-ai-safety',
      title: 'Technical AI Safety',
      shortDescription: 'Test course',
      units: [],
    });

    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      decision: 'Accept',
    });

    await testDb.insert(meetPersonTable, {
      id: 'facilitator-1',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-1',
      round: 'round-without-discussion',
      role: 'Facilitator',
      expectedDiscussionsFacilitator: ['discussion-next-week'],
    });

    await testDb.insert(groupDiscussionTable, {
      id: 'discussion-next-week',
      group: 'group-1',
      round: 'different-round',
      startDateTime: futureStartTimeSecs,
      endDateTime: futureEndTimeSecs,
      facilitators: [],
      participantsExpected: [],
    });

    const result = await caller.groupDiscussions.getByCourseSlug({ courseSlug: 'technical-ai-safety' });

    expect(result?.groupDiscussion?.id).toBe('discussion-next-week');
    expect(result?.userRole).toBe('facilitator');
  });
});
