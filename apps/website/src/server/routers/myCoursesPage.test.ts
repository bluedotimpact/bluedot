import {
  courseRegistrationTable,
  courseTable,
  groupDiscussionTable,
  groupTable,
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

const nowSec = Math.floor(Date.now() / 1000);
const ONE_DAY = 24 * 60 * 60;
const inOneWeek = nowSec + 7 * ONE_DAY;
const inOneMonth = nowSec + 30 * ONE_DAY;

describe('myCoursesPage.getOverview', () => {
  test('nextDiscussion ignores facilitated discussions, even when they are sooner', async () => {
    // User participates in course-p (next discussion in a month) and facilitates
    // course-f (next discussion in a week). nextDiscussion should be the participant one.
    await testDb.insert(courseTable, {
      id: 'course-p',
      slug: 'participant-course',
      title: 'Participant Course',
      shortDescription: 'p',
      units: [],
    });
    await testDb.insert(courseTable, {
      id: 'course-f',
      slug: 'facilitator-course',
      title: 'Facilitator Course',
      shortDescription: 'f',
      units: [],
    });

    await testDb.insert(courseRegistrationTable, {
      id: 'reg-p',
      email: CALLER_EMAIL,
      courseId: 'course-p',
      decision: 'Accept',
      role: 'Participant',
      roundStatus: 'Active',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-f',
      email: CALLER_EMAIL,
      courseId: 'course-f',
      decision: 'Accept',
      role: 'Facilitator',
      roundStatus: 'Active',
    });

    await testDb.insert(meetPersonTable, {
      id: 'mp-p',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-p',
      round: 'round-p',
      role: 'Participant',
      groupsAsParticipant: ['group-p'],
      expectedDiscussionsParticipant: ['disc-p'],
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-f',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-f',
      round: 'round-f',
      role: 'Facilitator',
      expectedDiscussionsFacilitator: ['disc-f'],
    });

    await testDb.insert(groupTable, {
      id: 'group-p',
      groupName: 'Group P',
      round: 'round-p',
      participants: ['mp-p'],
      facilitator: ['some-other-facilitator'],
    });
    await testDb.insert(groupTable, {
      id: 'group-f',
      groupName: 'Group F',
      round: 'round-f',
      participants: ['someone-else'],
      facilitator: ['mp-f'],
    });

    await testDb.insert(groupDiscussionTable, {
      id: 'disc-f',
      group: 'group-f',
      round: 'round-f',
      startDateTime: inOneWeek,
      endDateTime: inOneWeek + 60 * 60,
      facilitators: ['mp-f'],
      participantsExpected: [],
    });
    await testDb.insert(groupDiscussionTable, {
      id: 'disc-p',
      group: 'group-p',
      round: 'round-p',
      startDateTime: inOneMonth,
      endDateTime: inOneMonth + 60 * 60,
      facilitators: ['some-other-facilitator'],
      participantsExpected: ['mp-p'],
    });

    const result = await caller.myCoursesPage.getOverview();

    expect(result.nextDiscussion).not.toBeNull();
    expect(result.nextDiscussion?.discussion.id).toBe('disc-p');
    expect(result.nextDiscussion?.courseSlug).toBe('participant-course');

    // The facilitator-role course should not appear in the regular course list either.
    expect(result.courses.map((c) => c.course.slug)).toEqual(['participant-course']);
  });
});
