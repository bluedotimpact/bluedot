import {
  chunkTable, courseTable, eq, exerciseResponsePgTable, exerciseTable,
  selfServeCourseRegistrationTable, unitTable,
} from '@bluedot/db';
import {
  beforeEach, describe, expect, test,
} from 'vitest';
import {
  createCaller, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../../__tests__/dbTestUtils';
import { FOAI_COURSE_ID, FOAI_COURSE_SLUG } from '../../lib/constants';

setupTestDb();
beforeEach(seedLoggedInUser);
const caller = createCaller(testAuthContextLoggedIn);

const seedCourse = async (courseId = FOAI_COURSE_ID, slug = FOAI_COURSE_SLUG) => {
  await testDb.insert(courseTable, {
    id: courseId, slug, title: slug, shortDescription: slug, status: 'Active', units: ['unit-live'],
  });
  await testDb.insert(unitTable, {
    id: 'unit-live', courseId, courseSlug: slug, courseTitle: slug,
    title: 'Live unit', unitNumber: '1', unitStatus: 'Active',
  });
  await testDb.insert(chunkTable, {
    id: 'chunk-live', chunkId: 'chunk-live', unitId: 'unit-live',
    chunkTitle: 'Lesson', chunkOrder: '1', chunkType: 'Reading', chunkContent: '',
    status: 'Active', chunkExercises: ['old-1', 'old-2', 'shared-4'],
  });
  for (const id of ['old-1', 'old-2', 'shared-4']) {
    // eslint-disable-next-line no-await-in-loop
    await testDb.insert(exerciseTable, {
      id, courseId, type: 'Free text', status: 'Core',
    });
  }

  await testDb.insert(selfServeCourseRegistrationTable, {
    id: 'registration', userId: 'test-user', courseId, createdAt: '2026-01-01',
  });
};

const progress = (courseSlug = FOAI_COURSE_SLUG) => caller.courses.getCourseProgress({ courseSlug });
const save = (exerciseId: string, response: string, completed?: boolean) =>
  caller.exercises.saveExerciseResponse({ exerciseId, response, completed });

const seedInactiveDrafts = async () => {
  await testDb.insert(unitTable, {
    id: 'unit-draft', courseId: FOAI_COURSE_ID, courseSlug: FOAI_COURSE_SLUG,
    title: '[new] Unit', unitNumber: '1', unitStatus: 'Draft',
  });
  await testDb.insert(chunkTable, {
    id: 'chunk-draft', chunkId: 'chunk-draft', unitId: 'unit-draft', chunkTitle: '[new] Lesson',
    chunkOrder: '1', chunkType: 'Reading', chunkContent: '', status: 'Inactive',
    chunkExercises: ['new-1', 'new-2', 'copy-4'],
  });
  for (const id of ['new-1', 'new-2', 'copy-4']) {
    // eslint-disable-next-line no-await-in-loop
    await testDb.insert(exerciseTable, {
      id, courseId: FOAI_COURSE_ID, type: 'Free text', status: 'Inactive',
    });
  }
};

const simulateCutover = async () => {
  await testDb.update(exerciseTable, { id: 'old-1', status: 'Inactive' });
  await testDb.update(exerciseTable, { id: 'old-2', status: 'Inactive' });
  await testDb.update(exerciseTable, { id: 'new-1', status: 'Core' });
  await testDb.update(exerciseTable, { id: 'new-2', status: 'Core' });
  await testDb.update(chunkTable, { id: 'chunk-live', chunkExercises: ['new-1', 'new-2', 'shared-4'] });
};

describe('FoAI saved answers and progress against the real in-memory routers', () => {
  test.each(['', ' \n\t '])('does not count blank answer %j', async (answer) => {
    await seedCourse();
    const result = await save('old-1', answer);
    expect(result.certificateIssued).toBe(false);
    expect((await progress()).courseProgress).toEqual({ totalCount: 3, completedCount: 0, percentage: 0 });
  });

  test('autosaved answers count immediately, remain after a fresh read, and issue once at 3/3', async () => {
    await seedCourse();
    expect((await save('old-1', 'First answer')).certificateIssued).toBe(false);
    expect((await progress()).courseProgress).toEqual({ totalCount: 3, completedCount: 1, percentage: 33 });
    expect(await caller.exercises.getExerciseResponse({ exerciseId: 'old-1' })).toMatchObject({ response: 'First answer', completedAt: null });
    await save('old-2', 'Second answer');
    expect((await save('shared-4', 'Final reflection')).certificateIssued).toBe(true);
    expect((await progress()).courseProgress).toEqual({ totalCount: 3, completedCount: 3, percentage: 100 });
    expect((await save('shared-4', 'Edited reflection')).certificateIssued).toBe(false);
    expect(await caller.certificates.getStatus({ courseId: FOAI_COURSE_ID })).toMatchObject({ status: 'has-certificate', certificateId: 'registration' });
  });

  test('clearing an autosaved answer lowers progress; explicit completion still counts until unmarked', async () => {
    await seedCourse();
    await save('old-1', 'Answer');
    await save('old-1', '');
    expect((await progress()).courseProgress.completedCount).toBe(0);
    await save('old-1', 'Answer', true);
    await save('old-1', '');
    expect((await progress()).courseProgress.completedCount).toBe(1);
    await save('old-1', '', false);
    expect((await progress()).courseProgress.completedCount).toBe(0);
  });

  test('the latest blank response wins over an older duplicate marked complete', async () => {
    await seedCourse();
    await testDb.pg.insert(exerciseResponsePgTable.pg).values([
      {
        id: 'older', exerciseId: 'old-1', userId: ['test-user'], response: 'Old answer', completedAt: '2026-01-01', createdAt: '2026-01-01',
      },
      {
        id: 'newer', exerciseId: 'old-1', userId: ['test-user'], response: '', completedAt: null, createdAt: '2026-01-02',
      },
    ]);
    await save('old-2', 'Second');
    expect((await save('shared-4', 'Third')).certificateIssued).toBe(false);
    expect((await progress()).courseProgress.completedCount).toBe(2);
  });

  test('multiple choice still requires explicit completion', async () => {
    await seedCourse();
    await testDb.update(exerciseTable, { id: 'old-1', type: 'Multiple choice' });
    await save('old-1', 'A');
    expect((await progress()).courseProgress.completedCount).toBe(0);
    await save('old-1', 'A', true);
    expect((await progress()).courseProgress.completedCount).toBe(1);
  });

  test('other courses keep their explicit-completion rule for free text', async () => {
    await seedCourse('other-course-id', 'other-course');
    await save('old-1', 'Answer');
    expect((await progress('other-course')).courseProgress.completedCount).toBe(0);
    await save('old-1', 'Answer', true);
    expect((await progress('other-course')).courseProgress.completedCount).toBe(1);
  });

  test('three inactive copies do not add requirements or block the old course certificate', async () => {
    await seedCourse();
    await seedInactiveDrafts();
    await save('old-1', 'First');
    await save('old-2', 'Second');
    expect((await save('shared-4', 'Third')).certificateIssued).toBe(true);
    expect((await progress()).courseProgress).toEqual({ totalCount: 3, completedCount: 3, percentage: 100 });
  });

  test('cutover preserves the unchanged reflection and historical answers, and requires the new prompts', async () => {
    await seedCourse();
    await seedInactiveDrafts();
    await save('old-1', 'Old tool/agent answer');
    await save('shared-4', 'Retained final reflection');
    await simulateCutover();
    expect((await progress()).courseProgress).toEqual({ totalCount: 3, completedCount: 1, percentage: 33 });
    expect(await caller.exercises.getExerciseResponse({ exerciseId: 'old-1' })).toMatchObject({ response: 'Old tool/agent answer' });
    expect(await caller.exercises.getExerciseResponse({ exerciseId: 'new-1' })).toBeNull();
    expect((await save('new-1', 'New progress reflection')).certificateIssued).toBe(false);
    expect((await save('new-2', 'New intelligence reflection')).certificateIssued).toBe(true);
    expect((await progress()).courseProgress.percentage).toBe(100);
  });

  test('an issued certificate retains its ID/date through cutover and cleared answers', async () => {
    await seedCourse();
    await seedInactiveDrafts();
    await save('old-1', 'First');
    await save('old-2', 'Second');
    await save('shared-4', 'Third');
    const before = await testDb.get(selfServeCourseRegistrationTable, { id: 'registration' });
    await simulateCutover();
    await save('shared-4', '', false);
    const after = await testDb.get(selfServeCourseRegistrationTable, { id: 'registration' });
    expect(after.certificateId).toBe(before.certificateId);
    expect(after.certificateCreatedAt).toBe(before.certificateCreatedAt);
    const rows = await testDb.pg.select().from(exerciseResponsePgTable.pg).where(eq(exerciseResponsePgTable.pg.exerciseId, 'old-1'));
    expect(rows[0]?.response).toBe('First');
  });
});
