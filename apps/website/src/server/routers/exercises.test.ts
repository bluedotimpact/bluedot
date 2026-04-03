import {
  courseRegistrationTable,
  courseTable,
  exerciseResponseTable,
  groupTable,
  meetPersonTable,
} from '@bluedot/db';
import { describe, expect, test } from 'vitest';
import {
  createCaller,
  setupTestDb,
  testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';

setupTestDb();

const caller = createCaller(testAuthContextLoggedIn);
const CALLER_EMAIL = testAuthContextLoggedIn.auth!.email;

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

describe('exercises.getExerciseResponse', () => {
  test('returns null when no response exists', async () => {
    const result = await caller.exercises.getExerciseResponse({ exerciseId: 'exercise-1' });
    expect(result).toBeNull();
  });

  test('returns response scoped to the current user', async () => {
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
    await testDb.insert(exerciseResponseTable, {
      id: 'resp-1',
      email: 'participant@example.com',
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
    await testDb.insert(exerciseResponseTable, {
      id: 'resp-1',
      email: 'participant@example.com',
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
      name: null,
      role: 'Participant',
    });
    await testDb.insert(groupTable, {
      id: 'group-1',
      groupName: 'Group 1',
      facilitator: ['meet-facilitator'],
      participants: ['meet-participant'],
    });
    await testDb.insert(exerciseResponseTable, {
      id: 'resp-1',
      email: 'noname@example.com',
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
