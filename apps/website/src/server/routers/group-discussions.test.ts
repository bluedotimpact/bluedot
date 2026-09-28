import {
  courseRegistrationTable,
  courseTable,
  groupDiscussionTable,
  groupSwitchingTable,
  meetPersonTable,
} from '@bluedot/db';
import {
  beforeEach, describe, expect, test,
} from 'vitest';
import {
  createCaller,
  seedLoggedInUser,
  setupTestDb,
  testAuthContextLoggedIn,
  testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

// The authenticated user's row is assumed to exist by the userId-scoped routes.
beforeEach(async () => {
  await seedLoggedInUser();
});

describe('groupDiscussions.getByCourseSlug', () => {
  test('throws NOT_FOUND for an unknown course slug', async () => {
    await expect(caller.groupDiscussions.getByCourseSlug({ courseSlug: 'does-not-exist' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

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
      userId: 'test-user',
      courseId: 'course-1',
      decision: 'Accept',
    });

    await testDb.insert(meetPersonTable, {
      id: 'facilitator-1',
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

  describe('hasPendingReschedule', () => {
    const startSecs = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);

    const seedParticipant = async (overrides: { attendedDiscussions?: string[] } = {}) => {
      await testDb.insert(courseTable, {
        id: 'course-1', slug: 'technical-ai-safety', title: 'Technical AI Safety', shortDescription: 'Test course', units: [],
      });
      await testDb.insert(courseRegistrationTable, {
        id: 'reg-1', email: CALLER_EMAIL, userId: 'test-user', courseId: 'course-1', decision: 'Accept',
      });
      await testDb.insert(meetPersonTable, {
        id: 'participant-1',
        applicationsBaseRecordId: 'reg-1',
        round: 'round-1',
        role: 'Participant',
        expectedDiscussionsParticipant: ['disc-next'],
        attendedDiscussions: overrides.attendedDiscussions ?? [],
      });
      await testDb.insert(groupDiscussionTable, {
        id: 'disc-next',
        group: 'group-1',
        round: 'round-1',
        startDateTime: startSecs,
        endDateTime: startSecs + 60 * 60,
        facilitators: [],
        participantsExpected: ['participant-1'],
      });
    };

    test('true when the participant has an open one-unit request out of the shown discussion', async () => {
      await seedParticipant();
      await testDb.insert(groupSwitchingTable, {
        id: 'gs-1', participant: 'participant-1', requestStatus: 'Resolve', switchType: 'Switch group for one unit', oldDiscussion: ['disc-next'], manualRequest: true,
      });

      const result = await caller.groupDiscussions.getByCourseSlug({ courseSlug: 'technical-ai-safety' });
      expect(result?.groupDiscussion?.id).toBe('disc-next');
      expect(result?.hasPendingReschedule).toBe(true);
    });

    test('false for a completed request or a request about another discussion', async () => {
      await seedParticipant();
      await testDb.insert(groupSwitchingTable, {
        id: 'gs-done', participant: 'participant-1', requestStatus: 'Completed', switchType: 'Switch group for one unit', oldDiscussion: ['disc-next'],
      });
      await testDb.insert(groupSwitchingTable, {
        id: 'gs-other-disc', participant: 'participant-1', requestStatus: 'Resolve', switchType: 'Switch group for one unit', oldDiscussion: ['disc-other'],
      });

      const result = await caller.groupDiscussions.getByCourseSlug({ courseSlug: 'technical-ai-safety' });
      expect(result?.hasPendingReschedule).toBe(false);
    });

    test('false when a permanent switch is pending (that shows on the course row only)', async () => {
      await seedParticipant();
      await testDb.insert(groupSwitchingTable, {
        id: 'gs-perm', participant: 'participant-1', requestStatus: 'Resolve', switchType: 'Switch group permanently',
      });

      const result = await caller.groupDiscussions.getByCourseSlug({ courseSlug: 'technical-ai-safety' });
      expect(result?.hasPendingReschedule).toBe(false);
    });
  });
});
