import {
  applicationsRoundTable,
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
  testAuthContextLoggedOut,
  testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

const NOW = Math.floor(Date.now() / 1000);
const HOUR = 3600;

const seedCourse = (id: string, slug: string, title: string) =>
  testDb.insert(courseTable, {
    id,
    slug,
    title,
    shortDescription: 's',
    units: [],
    status: 'Active',
  });

const seedRound = (id: string, courseId: string, applicationDeadline: string | null) =>
  testDb.insert(applicationsRoundTable, {
    id,
    courseId,
    applicationDeadline,
    courseRoundIntensity: 'Technical AI Safety (2026 Mar W25) - Intensive',
    intensity: 'Intensive',
    firstDiscussionDate: '2026-03-10',
    lastDiscussionDate: '2026-03-17',
  });

const seedDiscussion = (id: string, endDateTime: number) =>
  testDb.insert(groupDiscussionTable, {
    id,
    group: 'group-1',
    facilitators: [],
    participantsExpected: [],
    startDateTime: endDateTime - HOUR,
    endDateTime,
  });

const seedMeetPerson = (id: string, applicationsBaseRecordId: string, expectedDiscussionsFacilitator: string[]) =>
  testDb.insert(meetPersonTable, {
    id,
    email: CALLER_EMAIL,
    applicationsBaseRecordId,
    role: 'Facilitator',
    expectedDiscussionsFacilitator,
  });

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

describe('facilitatorApplications.quickApplyPanel', () => {
  test('rejects unauthenticated callers', async () => {
    await expect(createCaller(testAuthContextLoggedOut).facilitatorApplications.quickApplyPanel()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('returns empty when caller has no facilitator registrations', async () => {
    expect(await caller.facilitatorApplications.quickApplyPanel()).toEqual([]);
  });

  test('omits a course whose cohort still has more than one future discussion', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-cohort',
    });
    await seedMeetPerson('mp-1', 'reg-1', ['d1', 'd2']);
    await seedDiscussion('d1', NOW + HOUR);
    await seedDiscussion('d2', NOW + 2 * HOUR);
    await seedRound('round-next', 'course-1', null);

    expect(await caller.facilitatorApplications.quickApplyPanel()).toEqual([]);
  });

  test('includes a course wrapping up (one future discussion) with its open, unapplied rounds', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-cohort',
    });
    await seedMeetPerson('mp-1', 'reg-1', ['d1', 'd2']);
    await seedDiscussion('d1', NOW - HOUR); // past
    await seedDiscussion('d2', NOW + HOUR); // one future
    await seedRound('round-cohort', 'course-1', null); // already applied — excluded
    await seedRound('round-next', 'course-1', null); // open, unapplied

    const result = await caller.facilitatorApplications.quickApplyPanel();
    expect(result).toEqual([
      {
        courseId: 'course-1',
        courseTitle: 'Technical AI Safety',
        courseSlug: 'tai',
        rounds: [
          {
            id: 'round-next',
            label: 'Week 25 Intensive',
            firstDiscussionDate: '2026-03-10',
            lastDiscussionDate: '2026-03-17',
          },
        ],
      },
    ]);
  });

  test('keeps a finished cohort (zero future discussions) eligible', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-cohort',
    });
    await seedMeetPerson('mp-1', 'reg-1', ['d1']);
    await seedDiscussion('d1', NOW - HOUR); // all done
    await seedRound('round-next', 'course-1', null);

    const result = await caller.facilitatorApplications.quickApplyPanel();
    expect(result.map((c) => c.courseId)).toEqual(['course-1']);
  });

  test('does not surface a cohort that has not started (no assigned discussions)', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-cohort',
    });
    await seedMeetPerson('mp-1', 'reg-1', []); // no schedule yet
    await seedRound('round-next', 'course-1', null);

    expect(await caller.facilitatorApplications.quickApplyPanel()).toEqual([]);
  });

  test('hides the course when every open round has already been applied to', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-cohort',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-2',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-next',
    });
    await seedMeetPerson('mp-1', 'reg-1', ['d1']);
    await seedDiscussion('d1', NOW - HOUR);
    await seedRound('round-cohort', 'course-1', null);
    await seedRound('round-next', 'course-1', null);

    expect(await caller.facilitatorApplications.quickApplyPanel()).toEqual([]);
  });

  test('excludes rounds whose application deadline has passed', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-cohort',
    });
    await seedMeetPerson('mp-1', 'reg-1', ['d1']);
    await seedDiscussion('d1', NOW - HOUR);
    await seedRound('round-closed', 'course-1', '2000-01-01');

    expect(await caller.facilitatorApplications.quickApplyPanel()).toEqual([]);
  });
});

describe('facilitatorApplications.quickApplyForm', () => {
  test('prefills from the most recent prior facilitator application for the same course', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-old',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-a',
      autoNumberId: 1,
      numGroupsToFacilitate: 1,
      motivationToFacilitate: 'old motivation',
    });
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-new',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-b',
      autoNumberId: 2,
      numGroupsToFacilitate: 3,
      motivationToFacilitate: 'new motivation',
      availabilityTimezone: 'UTC+01:00',
      availabilityIntervalsUTC: 'M16:00 M18:00',
    });
    await seedRound('round-next', 'course-1', null);

    const result = await caller.facilitatorApplications.quickApplyForm({ roundId: 'round-next' });
    expect(result.round).toMatchObject({ courseSlug: 'tai', label: 'Week 25 Intensive', id: 'round-next' });
    expect(result.prefill).toMatchObject({
      numGroupsToFacilitate: 3,
      motivationToFacilitate: 'new motivation',
      availabilityTimezone: 'UTC+01:00',
      availabilityIntervalsUTC: 'M16:00 M18:00',
    });
  });

  test('throws FORBIDDEN when the caller has not facilitated the course', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await seedRound('round-next', 'course-1', null);
    await expect(caller.facilitatorApplications.quickApplyForm({ roundId: 'round-next' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
    });
  });

  test('throws CONFLICT when already applied to the round', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-next',
    });
    await seedRound('round-next', 'course-1', null);
    await expect(caller.facilitatorApplications.quickApplyForm({ roundId: 'round-next' })).rejects.toMatchObject({
      code: 'CONFLICT',
    });
  });

  test('throws NOT_FOUND when the round is closed', async () => {
    await seedCourse('course-1', 'tai', 'Technical AI Safety');
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      role: 'Facilitator',
      roundId: 'round-a',
    });
    await seedRound('round-closed', 'course-1', '2000-01-01');
    await expect(caller.facilitatorApplications.quickApplyForm({ roundId: 'round-closed' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });

  test('throws NOT_FOUND when the round does not exist', async () => {
    await expect(caller.facilitatorApplications.quickApplyForm({ roundId: 'nope' })).rejects.toMatchObject({
      code: 'NOT_FOUND',
    });
  });
});

