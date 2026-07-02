import {
  courseRegistrationTable,
  courseTable,
  eq,
  exerciseResponsePgTable,
  exerciseTable,
  groupTable,
  meetPersonTable,
  selfServeCourseRegistrationTable,
  userTable,
} from '@bluedot/db';
import {
  beforeEach, describe, expect, test,
} from 'vitest';
import {
  createCaller,
  setupTestDb,
  testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';
import { FOAI_COURSE_ID } from '../../lib/constants';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

// The authenticated user's row is assumed to exist by the userId-scoped routes.
beforeEach(async () => {
  await testDb.insert(userTable, { id: 'user-1', email: CALLER_EMAIL, name: 'Test User' });
});

async function seedCourse() {
  return testDb.insert(courseTable, {
    id: 'course-1',
    slug: 'test-course',
    title: 'Test Course',
    shortDescription: 'A test course',
    units: [],
  });
}

/**
 * Seeds the full chain needed for a facilitator to see group responses:
 * course -> registration (Active) -> meetPerson (Facilitator) -> group -> participant meetPerson
 */
async function seedFacilitatorFlow() {
  await seedCourse();

  await testDb.insert(courseRegistrationTable, {
    id: 'reg-facilitator',
    email: CALLER_EMAIL,
    courseId: 'course-1',
    decision: 'Accept',
    roundStatus: 'Active',
  });

  await testDb.insert(meetPersonTable, {
    id: 'meet-facilitator',
    email: CALLER_EMAIL,
    applicationsBaseRecordId: 'reg-facilitator',
    role: 'Facilitator',
  });

  await testDb.insert(meetPersonTable, {
    id: 'meet-participant',
    email: 'participant@example.com',
    userId: 'up-user',
    name: 'Alice',
    role: 'Participant',
  });

  await testDb.insert(groupTable, {
    id: 'group-1',
    groupName: 'Group 1',
    facilitator: ['meet-facilitator'],
    participants: ['meet-participant'],
  });
}

describe('exercises.saveExerciseResponse', () => {
  test('creates a new response when none exists', async () => {
    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'My first answer',
    });

    expect(result).toMatchObject({
      email: 'test@example.com',
      exerciseId: 'exercise-1',
      response: 'My first answer',
      completedAt: null,
    });
    expect(result.id).toBeDefined();
    // Same format as the Airtable "default to current date" values this replaces, e.g. 2026-06-10T11:03:38.910Z
    expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('writes userId on insert when the user exists', async () => {
    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'My answer',
    });

    expect(result.userId).toEqual(['user-1']);
  });

  test('throws UNAUTHORIZED when the user row is missing', async () => {
    const noUserCaller = createCaller({
      ...testAuthContextLoggedIn,
      auth: { ...testAuthContextLoggedIn.auth!, email: 'nouser@example.com' },
    });

    await expect(noUserCaller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'My answer',
    })).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });

  test('updates an existing response', async () => {
    await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Draft answer',
    });

    const updated = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Final answer',
    });

    expect(updated.response).toBe('Final answer');

    const fetched = await caller.exercises.getExerciseResponse({ exerciseId: 'exercise-1' });
    expect(fetched).toMatchObject({
      response: 'Final answer',
      completedAt: null,
    });
  });

  test('sets completedAt when completed: true', async () => {
    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Complete answer',
      completed: true,
    });

    expect(result.completedAt).toBeTruthy();
    expect(new Date(result.completedAt!).getTime()).not.toBeNaN();
  });

  test('clears completedAt when completed: false', async () => {
    await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Answer',
      completed: true,
    });

    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Answer',
      completed: false,
    });

    expect(result.completedAt).toBeNull();
  });

  test('preserves completedAt when completed is omitted', async () => {
    await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Answer',
      completed: true,
    });

    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'Updated answer',
    });

    expect(result.response).toBe('Updated answer');
    expect(result.completedAt).toBeTruthy();
  });
});

describe('exercises.saveExerciseResponse — FOAI auto-certificate', () => {
  // Self-serve is the authoritative table for FoAI issuance post read-switch (#2526)
  async function seedFoaiRegistration() {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-foai',
      email: CALLER_EMAIL,
      courseId: FOAI_COURSE_ID,
    });
  }

  const getSelfServeFoai = async () => {
    const [row] = await testDb.pg.select().from(selfServeCourseRegistrationTable.pg)
      .where(eq(selfServeCourseRegistrationTable.pg.id, 'ss-foai'));
    return row;
  };

  test('auto-issues a certificate when the final FOAI exercise is completed', async () => {
    await seedFoaiRegistration();
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Reading reflection', exerciseNumber: '1',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-2', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Action plan', exerciseNumber: '2',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1', email: CALLER_EMAIL, userId: ['user-1'], exerciseId: 'foai-ex-1', response: 'done', completedAt: '2026-01-01',
    });

    const before = Math.floor(Date.now() / 1000);
    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'foai-ex-2',
      response: 'plan submitted',
      completed: true,
    });

    expect(result.certificateIssued).toBe(true);

    const reg = await getSelfServeFoai();
    expect(reg?.certificateId).toBe('ss-foai');
    expect(reg?.certificateCreatedAt).toBeGreaterThanOrEqual(before);
  });

  test('does not auto-issue when other FOAI exercises remain incomplete', async () => {
    await seedFoaiRegistration();
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Ex 1', exerciseNumber: '1',
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-2', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Ex 2', exerciseNumber: '2',
    });

    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'foai-ex-1',
      response: 'done',
      completed: true,
    });

    expect(result.certificateIssued).toBe(false);
    const reg = await getSelfServeFoai();
    expect(reg?.certificateId).toBeFalsy();
  });

  test('does not auto-issue for non-FOAI courses', async () => {
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-other', email: CALLER_EMAIL, courseId: 'rec-other', decision: 'Accept',
    });
    await testDb.insert(exerciseTable, {
      id: 'other-ex-1', courseId: 'rec-other', status: 'Active', title: 'Other', exerciseNumber: '1',
    });

    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'other-ex-1',
      response: 'done',
      completed: true,
    });

    expect(result.certificateIssued).toBe(false);
    const reg = await testDb.get(courseRegistrationTable, { id: 'reg-other' });
    expect(reg.certificateId).toBeFalsy();
  });

  test('is a no-op when the certificate is already issued', async () => {
    await testDb.insert(selfServeCourseRegistrationTable, {
      id: 'ss-foai',
      email: CALLER_EMAIL,
      courseId: FOAI_COURSE_ID,
      certificateId: 'ss-foai',
      certificateCreatedAt: 1700000000,
    });
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Ex 1', exerciseNumber: '1',
    });

    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'foai-ex-1',
      response: 'done',
      completed: true,
    });

    expect(result.certificateIssued).toBe(false);
    const reg = await getSelfServeFoai();
    expect(reg?.certificateCreatedAt).toBe(1700000000);
  });

  test('does not auto-issue when completed is false (un-marking)', async () => {
    await seedFoaiRegistration();
    await testDb.insert(exerciseTable, {
      id: 'foai-ex-1', courseId: FOAI_COURSE_ID, status: 'Active', title: 'Ex 1', exerciseNumber: '1',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1', email: CALLER_EMAIL, userId: ['user-1'], exerciseId: 'foai-ex-1', response: 'done', completedAt: '2026-01-01',
    });

    const result = await caller.exercises.saveExerciseResponse({
      exerciseId: 'foai-ex-1',
      response: 'unmark',
      completed: false,
    });

    expect(result.certificateIssued).toBe(false);
    const reg = await getSelfServeFoai();
    expect(reg?.certificateId).toBeFalsy();
  });
});

describe('exercises.getExerciseResponse', () => {
  test('returns null when no response exists', async () => {
    const result = await caller.exercises.getExerciseResponse({ exerciseId: 'exercise-1' });
    expect(result).toBeNull();
  });

  test('returns response scoped to the current user', async () => {
    await testDb.insert(userTable, { id: 'user-other', email: 'other@example.com', name: 'Other User' });

    await caller.exercises.saveExerciseResponse({
      exerciseId: 'exercise-1',
      response: 'My answer',
    });

    const otherCaller = createCaller({
      ...testAuthContextLoggedIn,
      auth: {
        ...testAuthContextLoggedIn.auth!,
        email: 'other@example.com',
      },
    });

    const otherResult = await otherCaller.exercises.getExerciseResponse({ exerciseId: 'exercise-1' });
    expect(otherResult).toBeNull();

    const myResult = await caller.exercises.getExerciseResponse({ exerciseId: 'exercise-1' });
    expect(myResult).toMatchObject({ response: 'My answer' });
  });
});

describe('exercises.getGroupExerciseResponses', () => {
  test('throws NOT_FOUND when course does not exist', async () => {
    await expect(caller.exercises.getGroupExerciseResponses({
      courseSlug: 'nonexistent-course',
      exerciseId: 'ex-1',
    })).rejects.toThrow('Course not found');
  });

  test('returns null when registration has roundStatus "Past"', async () => {
    await seedCourse();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      decision: 'Accept',
      roundStatus: 'Past',
    });
    await testDb.insert(meetPersonTable, {
      id: 'meet-facilitator',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-1',
      role: 'Facilitator',
    });
    await testDb.insert(meetPersonTable, { id: 'meet-participant', email: 'participant@example.com', name: 'Alice' });
    await testDb.insert(groupTable, {
      id: 'group-1',
      facilitator: ['meet-facilitator'],
      participants: ['meet-participant'],
    });

    const result = await caller.exercises.getGroupExerciseResponses({
      courseSlug: 'test-course',
      exerciseId: 'ex-1',
    });

    expect(result).toBeNull();
  });

  test('returns null when registration is marked as duplicate', async () => {
    await seedCourse();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      decision: 'Accept',
      roundStatus: null,
      isDuplicate: true,
    });
    await testDb.insert(meetPersonTable, {
      id: 'meet-facilitator',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-1',
      role: 'Facilitator',
    });
    await testDb.insert(meetPersonTable, { id: 'meet-participant', email: 'participant@example.com', name: 'Alice' });
    await testDb.insert(groupTable, {
      id: 'group-1',
      facilitator: ['meet-facilitator'],
      participants: ['meet-participant'],
    });

    const result = await caller.exercises.getGroupExerciseResponses({
      courseSlug: 'test-course',
      exerciseId: 'ex-1',
    });

    expect(result).toBeNull();
  });

  test('returns null for self-paced course (roundStatus null, no meetPerson record)', async () => {
    await seedCourse();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      decision: 'Accept',
      roundStatus: null,
    });

    const result = await caller.exercises.getGroupExerciseResponses({
      courseSlug: 'test-course',
      exerciseId: 'ex-1',
    });

    expect(result).toBeNull();
  });

  test('returns groups for null-roundStatus facilitator with full chain seeded', async () => {
    await seedCourse();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      decision: 'Accept',
      roundStatus: null,
    });
    await testDb.insert(meetPersonTable, {
      id: 'meet-facilitator',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-1',
      role: 'Facilitator',
    });
    await testDb.insert(meetPersonTable, {
      id: 'meet-participant', email: 'participant@example.com', userId: 'up-user', name: 'Alice',
    });
    await testDb.insert(groupTable, {
      id: 'group-1',
      facilitator: ['meet-facilitator'],
      participants: ['meet-participant'],
    });

    const result = await caller.exercises.getGroupExerciseResponses({
      courseSlug: 'test-course',
      exerciseId: 'ex-1',
    });

    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(1);
    expect(result!.groups[0]!.totalParticipants).toBe(1);
  });

  test('returns null for a participant (non-facilitator role)', async () => {
    await seedCourse();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-1',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      decision: 'Accept',
      roundStatus: 'Active',
    });
    await testDb.insert(meetPersonTable, {
      id: 'meet-1',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-1',
      role: 'Participant',
    });

    const result = await caller.exercises.getGroupExerciseResponses({
      courseSlug: 'test-course',
      exerciseId: 'ex-1',
    });

    expect(result).toBeNull();
  });

  test('returns groups with empty responses when no participants have completed the exercise', async () => {
    await seedFacilitatorFlow();

    const result = await caller.exercises.getGroupExerciseResponses({
      courseSlug: 'test-course',
      exerciseId: 'ex-1',
    });

    expect(result).not.toBeNull();
    expect(result!.groups).toHaveLength(1);
    expect(result!.groups[0]).toMatchObject({
      id: 'group-1',
      name: 'Group 1',
      totalParticipants: 1,
      responses: [],
    });
  });

  test('returns completed responses from group participants', async () => {
    await seedFacilitatorFlow();
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1',
      email: 'participant@example.com',
      userId: ['up-user'],
      exerciseId: 'ex-1',
      response: 'My answer',
      completedAt: new Date().toISOString(),
    });

    const result = await caller.exercises.getGroupExerciseResponses({
      courseSlug: 'test-course',
      exerciseId: 'ex-1',
    });

    expect(result!.groups[0]!.responses).toHaveLength(1);
    expect(result!.groups[0]!.responses[0]).toMatchObject({
      name: 'Alice',
      response: 'My answer',
    });
  });

  test('excludes responses where completedAt is null', async () => {
    await seedFacilitatorFlow();
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1',
      email: 'participant@example.com',
      userId: ['up-user'],
      exerciseId: 'ex-1',
      response: 'Work in progress',
      completedAt: null,
    });

    const result = await caller.exercises.getGroupExerciseResponses({
      courseSlug: 'test-course',
      exerciseId: 'ex-1',
    });

    expect(result!.groups[0]!.responses).toHaveLength(0);
  });

  test('falls back to "Anonymous" when participant has no name', async () => {
    await seedCourse();
    await testDb.insert(courseRegistrationTable, {
      id: 'reg-facilitator',
      email: CALLER_EMAIL,
      courseId: 'course-1',
      decision: 'Accept',
      roundStatus: 'Active',
    });
    await testDb.insert(meetPersonTable, {
      id: 'meet-facilitator',
      email: CALLER_EMAIL,
      applicationsBaseRecordId: 'reg-facilitator',
      role: 'Facilitator',
    });
    await testDb.insert(meetPersonTable, {
      id: 'meet-participant',
      email: 'noname@example.com',
      userId: 'noname-user',
      name: null,
      role: 'Participant',
    });
    await testDb.insert(groupTable, {
      id: 'group-1',
      groupName: 'Group 1',
      facilitator: ['meet-facilitator'],
      participants: ['meet-participant'],
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'resp-1',
      email: 'noname@example.com',
      userId: ['noname-user'],
      exerciseId: 'ex-1',
      response: 'An answer',
      completedAt: new Date().toISOString(),
    });

    const result = await caller.exercises.getGroupExerciseResponses({
      courseSlug: 'test-course',
      exerciseId: 'ex-1',
    });

    expect(result!.groups[0]!.responses[0]!.name).toBe('Anonymous');
  });
});
