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
      status: 'Active',
    });
    await testDb.insert(courseTable, {
      id: 'course-f',
      slug: 'facilitator-course',
      title: 'Facilitator Course',
      shortDescription: 'f',
      units: [],
      status: 'Active',
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

    const result = await caller.myBluedot.myCoursesPage();

    expect(result.nextDiscussion).not.toBeNull();
    expect(result.nextDiscussion?.discussion.id).toBe('disc-p');
    expect(result.nextDiscussion?.courseSlug).toBe('participant-course');

    // The facilitator-role course should not appear in the regular course list either.
    expect(result.courses.map((c) => c.course.slug)).toEqual(['participant-course']);
  });

  test('dropped-out registrations do not contribute discussions to nextDiscussion', async () => {
    // User is dropped from course-dropped (cr.dropoutId set, decision still 'Accept').
    // The Airtable lookup field expectedDiscussionsParticipant still references their
    // discussions, which would otherwise win as the soonest. nextDiscussion should fall
    // through to the active enrollment instead.
    await testDb.insert(courseTable, {
      id: 'course-active',
      slug: 'active-course',
      title: 'Active Course',
      shortDescription: 'a',
      units: [],
      status: 'Active',
    });
    await testDb.insert(courseTable, {
      id: 'course-dropped',
      slug: 'dropped-course',
      title: 'Dropped Course',
      shortDescription: 'd',
      units: [],
      status: 'Active',
    });

    await testDb.insert(courseRegistrationTable, {
      id: 'reg-active',
      email: CALLER_EMAIL,
      courseId: 'course-active',
      decision: 'Accept',
      role: 'Participant',
      roundStatus: 'Active',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-dropped',
      email: CALLER_EMAIL,
      courseId: 'course-dropped',
      decision: 'Accept',
      role: 'Participant',
      roundStatus: 'Active',
      dropoutId: ['dropout-1'],
    });

    await testDb.insert(meetPersonTable, {
      id: 'mp-active',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-active',
      round: 'round-active',
      role: 'Participant',
      groupsAsParticipant: ['group-active'],
      expectedDiscussionsParticipant: ['disc-active'],
    });
    await testDb.insert(meetPersonTable, {
      id: 'mp-dropped',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-dropped',
      round: 'round-dropped',
      role: 'Participant',
      groupsAsParticipant: ['group-dropped'],
      expectedDiscussionsParticipant: ['disc-dropped'],
    });

    await testDb.insert(groupTable, {
      id: 'group-active',
      groupName: 'Group Active',
      round: 'round-active',
      participants: ['mp-active'],
    });
    await testDb.insert(groupTable, {
      id: 'group-dropped',
      groupName: 'Group Dropped',
      round: 'round-dropped',
      participants: ['mp-dropped'],
    });

    // Dropped course's discussion is sooner — must not surface as nextDiscussion.
    await testDb.insert(groupDiscussionTable, {
      id: 'disc-dropped',
      group: 'group-dropped',
      round: 'round-dropped',
      startDateTime: inOneWeek,
      endDateTime: inOneWeek + 60 * 60,
      facilitators: [],
      participantsExpected: ['mp-dropped'],
    });
    await testDb.insert(groupDiscussionTable, {
      id: 'disc-active',
      group: 'group-active',
      round: 'round-active',
      startDateTime: inOneMonth,
      endDateTime: inOneMonth + 60 * 60,
      facilitators: [],
      participantsExpected: ['mp-active'],
    });

    const result = await caller.myBluedot.myCoursesPage();

    expect(result.nextDiscussion).not.toBeNull();
    expect(result.nextDiscussion?.discussion.id).toBe('disc-active');
  });

  test('registrations whose course is non-Active (archived) are filtered out', async () => {
    await testDb.insert(courseTable, {
      id: 'course-active',
      slug: 'active-course',
      title: 'Active Course',
      shortDescription: 'a',
      units: [],
      status: 'Active',
    });
    await testDb.insert(courseTable, {
      id: 'course-archived',
      slug: 'archived-course',
      title: 'Archived Course',
      shortDescription: 'b',
      units: [],
      status: 'Past',
    });

    await testDb.insert(courseRegistrationTable, {
      id: 'reg-active',
      email: CALLER_EMAIL,
      courseId: 'course-active',
      decision: 'Accept',
      role: 'Participant',
      roundStatus: 'Past',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-archived',
      email: CALLER_EMAIL,
      courseId: 'course-archived',
      decision: 'Accept',
      role: 'Participant',
      roundStatus: 'Past',
    });

    const result = await caller.myBluedot.myCoursesPage();
    expect(result.courses.map((c) => c.course.slug)).toEqual(['active-course']);
  });

  describe('real-data shapes', () => {
    // Helpers used by the tests in this block. Defaults match the most common shape; pass only
    // the fields that differ for the case under test.
    const seedCourse = (id: string, opts: { status?: 'Active' | 'Past' } = {}) =>
      testDb.insert(courseTable, {
        id, slug: id, title: id, shortDescription: id, units: [], status: opts.status ?? 'Active',
      });

    const seedReg = (id: string, opts: Partial<{
      courseId: string;
      decision: 'Accept' | 'Reject' | 'Withdrawn' | null;
      role: 'Participant' | 'Facilitator' | null;
      roundStatus: 'Active' | 'Future' | 'Past' | null;
      roundId: string | null;
      dropoutId: string[] | null;
      deferredId: string[] | null;
    }> = {}) =>
      testDb.insert(courseRegistrationTable, {
        id, email: CALLER_EMAIL, decision: 'Accept', role: 'Participant', roundStatus: 'Active', ...opts,
      });

    test('two registrations for the same course in different rounds produce two rows', async () => {
      await seedCourse('course-tais');
      await seedReg('reg-intensive', { courseId: 'course-tais', roundStatus: 'Future', roundId: 'round-intensive' });
      await seedReg('reg-parttime', { courseId: 'course-tais', roundStatus: 'Future', roundId: 'round-parttime' });

      const result = await caller.myBluedot.myCoursesPage();
      expect(result.courses).toHaveLength(2);
      expect(result.courses.map((c) => c.courseRegistration.id).sort()).toEqual(['reg-intensive', 'reg-parttime']);
    });

    test('user who is Participant in one round and Facilitator in another only sees the Participant row', async () => {
      await seedCourse('course-agi');
      await seedReg('reg-as-participant', { courseId: 'course-agi', role: 'Participant', roundId: 'round-1' });
      await seedReg('reg-as-facilitator', { courseId: 'course-agi', role: 'Facilitator', roundId: 'round-2' });

      const result = await caller.myBluedot.myCoursesPage();
      expect(result.courses).toHaveLength(1);
      expect(result.courses[0]?.courseRegistration.id).toBe('reg-as-participant');
    });

    test('Future + Accept + dropoutId keeps the row but excludes its discussions from nextDiscussion', async () => {
      await seedCourse('course-tais');
      await seedReg('reg-dropped', {
        courseId: 'course-tais', roundStatus: 'Future', dropoutId: ['dropout-1'], deferredId: null,
      });

      await testDb.insert(meetPersonTable, {
        id: 'mp-dropped',
        email: CALLER_EMAIL,
        applicationsBaseRecordId: 'reg-dropped',
        round: 'round-dropped',
        role: 'Participant',
        groupsAsParticipant: ['group-dropped'],
        expectedDiscussionsParticipant: ['disc-dropped'],
      });
      await testDb.insert(groupTable, {
        id: 'group-dropped',
        groupName: 'G',
        round: 'round-dropped',
        participants: ['mp-dropped'],
      });
      await testDb.insert(groupDiscussionTable, {
        id: 'disc-dropped',
        group: 'group-dropped',
        round: 'round-dropped',
        startDateTime: inOneWeek,
        endDateTime: inOneWeek + 60 * 60,
        facilitators: [],
        participantsExpected: ['mp-dropped'],
      });

      const result = await caller.myBluedot.myCoursesPage();
      // Row preserved so it can land in the Past Courses tab with a Dropped pill + Apply again.
      expect(result.courses.map((c) => c.courseRegistration.id)).toEqual(['reg-dropped']);
      // But its discussion must not surface in the "Next discussion" card.
      expect(result.nextDiscussion).toBeNull();
    });

    test('deferred row coexists with successor row (both appear)', async () => {
      await seedCourse('course-tais');
      // Original registration: deferred away (both dropoutId AND deferredId set).
      await seedReg('reg-deferred', {
        courseId: 'course-tais', roundStatus: 'Past', dropoutId: ['dropout-1'], deferredId: ['defer-1'],
      });
      // Successor registration: fresh row in the new round.
      await seedReg('reg-successor', { courseId: 'course-tais', roundStatus: 'Active' });

      const result = await caller.myBluedot.myCoursesPage();
      expect(result.courses.map((c) => c.courseRegistration.id).sort()).toEqual(['reg-deferred', 'reg-successor']);
    });

    test('facilitatorNames: assembles first+last, drops entries with both names blank', async () => {
      await seedCourse('course-tais');
      await seedReg('reg-1', { courseId: 'course-tais' });

      await testDb.insert(meetPersonTable, {
        id: 'mp-self',
        email: CALLER_EMAIL,
        applicationsBaseRecordId: 'reg-1',
        round: 'round-1',
        role: 'Participant',
        groupsAsParticipant: ['group-1'],
        expectedDiscussionsParticipant: [],
      });
      // Three facilitators on the group: two with usable names, one with both names blank.
      await testDb.insert(meetPersonTable, {
        id: 'fac-full', email: 'fac-full@example.com', firstName: 'Full', lastName: 'Name', role: 'Facilitator',
      });
      await testDb.insert(meetPersonTable, {
        id: 'fac-first-only', email: 'fac-first-only@example.com', firstName: 'Firstonly', lastName: null, role: 'Facilitator',
      });
      await testDb.insert(meetPersonTable, {
        id: 'fac-blank', email: 'fac-blank@example.com', firstName: '', lastName: '', role: 'Facilitator',
      });
      await testDb.insert(groupTable, {
        id: 'group-1',
        groupName: 'G',
        round: 'round-1',
        participants: ['mp-self'],
        facilitator: ['fac-full', 'fac-first-only', 'fac-blank'],
      });

      const result = await caller.myBluedot.myCoursesPage();
      expect(result.courses).toHaveLength(1);
      expect(result.courses[0]?.facilitatorNames.sort()).toEqual(['Firstonly', 'Full Name']);
    });

    test('discussion linked to a unit that no longer exists builds the row without crashing', async () => {
      await seedCourse('course-tais');
      await seedReg('reg-1', { courseId: 'course-tais' });

      await testDb.insert(meetPersonTable, {
        id: 'mp-1',
        email: CALLER_EMAIL,
        applicationsBaseRecordId: 'reg-1',
        round: 'round-1',
        role: 'Participant',
        groupsAsParticipant: ['group-1'],
        expectedDiscussionsParticipant: ['disc-orphan-unit'],
      });
      await testDb.insert(groupTable, {
        id: 'group-1', groupName: 'G', round: 'round-1', participants: ['mp-1'],
      });
      await testDb.insert(groupDiscussionTable, {
        id: 'disc-orphan-unit',
        group: 'group-1',
        round: 'round-1',
        startDateTime: inOneWeek,
        endDateTime: inOneWeek + 60 * 60,
        facilitators: [],
        participantsExpected: ['mp-1'],
        // Reference a unit that doesn't exist in the unit table.
        courseBuilderUnitRecordId: 'rec-deleted-unit',
      });

      const result = await caller.myBluedot.myCoursesPage();
      expect(result.courses).toHaveLength(1);
      const row = result.courses[0]!;
      expect(row.discussions.map((d) => d.id)).toEqual(['disc-orphan-unit']);
      // The discussion is present but the unit lookup yielded nothing — no crash, no entry.
      expect(row.units).toEqual({});
      expect(result.nextDiscussion?.unit).toBeNull();
    });

    test('nextDiscussion picks a live discussion (started, not yet ended) over a later upcoming one', async () => {
      await seedCourse('course-tais');
      await seedReg('reg-1', { courseId: 'course-tais' });

      await testDb.insert(meetPersonTable, {
        id: 'mp-1',
        email: CALLER_EMAIL,
        applicationsBaseRecordId: 'reg-1',
        round: 'round-1',
        role: 'Participant',
        groupsAsParticipant: ['group-1'],
        expectedDiscussionsParticipant: ['disc-live', 'disc-future'],
      });
      await testDb.insert(groupTable, {
        id: 'group-1', groupName: 'G', round: 'round-1', participants: ['mp-1'],
      });
      // Live now: started 10 min ago, ends in 50 min.
      await testDb.insert(groupDiscussionTable, {
        id: 'disc-live',
        group: 'group-1',
        round: 'round-1',
        startDateTime: nowSec - 10 * 60,
        endDateTime: nowSec + 50 * 60,
        facilitators: [],
        participantsExpected: ['mp-1'],
      });
      await testDb.insert(groupDiscussionTable, {
        id: 'disc-future',
        group: 'group-1',
        round: 'round-1',
        startDateTime: inOneWeek,
        endDateTime: inOneWeek + 60 * 60,
        facilitators: [],
        participantsExpected: ['mp-1'],
      });

      const result = await caller.myBluedot.myCoursesPage();
      expect(result.nextDiscussion?.discussion.id).toBe('disc-live');
    });

    test('nextDiscussion picks the soonest discussion globally across two participant courses', async () => {
      await seedCourse('course-x');
      await seedCourse('course-y');
      await seedReg('reg-x', { courseId: 'course-x' });
      await seedReg('reg-y', { courseId: 'course-y' });

      await testDb.insert(meetPersonTable, {
        id: 'mp-x',
        email: CALLER_EMAIL,
        applicationsBaseRecordId: 'reg-x',
        round: 'round-x',
        role: 'Participant',
        groupsAsParticipant: ['group-x'],
        expectedDiscussionsParticipant: ['disc-x'],
      });
      await testDb.insert(meetPersonTable, {
        id: 'mp-y',
        email: CALLER_EMAIL,
        applicationsBaseRecordId: 'reg-y',
        round: 'round-y',
        role: 'Participant',
        groupsAsParticipant: ['group-y'],
        expectedDiscussionsParticipant: ['disc-y'],
      });
      await testDb.insert(groupTable, {
        id: 'group-x', groupName: 'GX', round: 'round-x', participants: ['mp-x'],
      });
      await testDb.insert(groupTable, {
        id: 'group-y', groupName: 'GY', round: 'round-y', participants: ['mp-y'],
      });
      // course-x discussion is sooner than course-y's.
      await testDb.insert(groupDiscussionTable, {
        id: 'disc-x',
        group: 'group-x',
        round: 'round-x',
        startDateTime: inOneWeek,
        endDateTime: inOneWeek + 60 * 60,
        facilitators: [],
        participantsExpected: ['mp-x'],
      });
      await testDb.insert(groupDiscussionTable, {
        id: 'disc-y',
        group: 'group-y',
        round: 'round-y',
        startDateTime: inOneMonth,
        endDateTime: inOneMonth + 60 * 60,
        facilitators: [],
        participantsExpected: ['mp-y'],
      });

      const result = await caller.myBluedot.myCoursesPage();
      expect(result.nextDiscussion?.discussion.id).toBe('disc-x');
      expect(result.nextDiscussion?.courseSlug).toBe('course-x');
    });

    test('rescheduleEligibleUnits is scoped per round (different rounds yield different eligible sets)', async () => {
      // Two parallel courses. Each round has the user's own group plus an alternate group that
      // accepts Neutral switchers. Round X's alt offers unit "1"; round Y's alt offers unit "2".
      // If round-scoping breaks, every row would see both units as eligible.
      await seedCourse('course-x');
      await seedCourse('course-y');
      await seedReg('reg-x', { courseId: 'course-x' });
      await seedReg('reg-y', { courseId: 'course-y' });

      await testDb.insert(meetPersonTable, {
        id: 'mp-x',
        email: CALLER_EMAIL,
        applicationsBaseRecordId: 'reg-x',
        round: 'round-x',
        role: 'Participant',
        groupsAsParticipant: ['group-x-self'],
        expectedDiscussionsParticipant: [],
      });
      await testDb.insert(meetPersonTable, {
        id: 'mp-y',
        email: CALLER_EMAIL,
        applicationsBaseRecordId: 'reg-y',
        round: 'round-y',
        role: 'Participant',
        groupsAsParticipant: ['group-y-self'],
        expectedDiscussionsParticipant: [],
      });

      await testDb.insert(groupTable, {
        id: 'group-x-self', groupName: 'X self', round: 'round-x', participants: ['mp-x'],
      });
      await testDb.insert(groupTable, {
        id: 'group-x-alt',
        groupName: 'X alt',
        round: 'round-x',
        participants: ['someone-else'],
        whoCanSwitchIntoThisGroup: ['Neutral'],
      });
      await testDb.insert(groupTable, {
        id: 'group-y-self', groupName: 'Y self', round: 'round-y', participants: ['mp-y'],
      });
      await testDb.insert(groupTable, {
        id: 'group-y-alt',
        groupName: 'Y alt',
        round: 'round-y',
        participants: ['someone-else'],
        whoCanSwitchIntoThisGroup: ['Neutral'],
      });

      // Round X alt offers unit 1; round Y alt offers unit 2.
      await testDb.insert(groupDiscussionTable, {
        id: 'disc-x-alt',
        group: 'group-x-alt',
        round: 'round-x',
        unitNumber: 1,
        startDateTime: inOneWeek,
        endDateTime: inOneWeek + 60 * 60,
        facilitators: [],
        participantsExpected: ['someone-else'],
      });
      await testDb.insert(groupDiscussionTable, {
        id: 'disc-y-alt',
        group: 'group-y-alt',
        round: 'round-y',
        unitNumber: 2,
        startDateTime: inOneWeek,
        endDateTime: inOneWeek + 60 * 60,
        facilitators: [],
        participantsExpected: ['someone-else'],
      });

      const result = await caller.myBluedot.myCoursesPage();
      const byRegId = Object.fromEntries(result.courses.map((c) => [c.courseRegistration.id, c]));
      expect(byRegId['reg-x']?.rescheduleEligibleUnits).toEqual(['1']);
      expect(byRegId['reg-y']?.rescheduleEligibleUnits).toEqual(['2']);
    });
  });
});
