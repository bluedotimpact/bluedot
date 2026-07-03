import {
  chunkTable,
  courseTable,
  exerciseResponsePgTable,
  exerciseTable,
  unitTable,
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

const seedCourse = (slug: string) => testDb.insert(courseTable, {
  id: `course-${slug}`, slug, title: slug, shortDescription: slug, units: [], status: 'Active',
});

const seedUnit = (id: string, courseSlug: string, unitNumber: string, opts: { unitStatus?: string } = {}) =>
  testDb.insert(unitTable, {
    id,
    courseId: `course-${courseSlug}`,
    courseTitle: courseSlug,
    courseSlug,
    title: id,
    unitNumber,
    unitStatus: opts.unitStatus ?? 'Active',
  });

// estimatedTime defaults to 0 — matching prod, where ~60% of active chunks have no time set.
const seedChunk = (id: string, unitId: string, opts: {
  title?: string; estimatedTime?: number; exercises?: string[]; status?: string;
} = {}) =>
  testDb.insert(chunkTable, {
    id,
    chunkId: id,
    unitId,
    chunkTitle: opts.title ?? id,
    chunkOrder: '1',
    chunkType: 'Reading',
    chunkContent: '',
    estimatedTime: opts.estimatedTime ?? 0,
    chunkExercises: opts.exercises ?? [],
    status: opts.status ?? 'Active',
  });

const seedExercise = (id: string, status = 'Core') => testDb.insert(exerciseTable, { id, status });

// Cases mirror real course-builder data shapes (see gh-2544 prod inspection): most chunks carry no
// estimatedTime; some chunkExercises reference inactive exercises; alignment/pandemics use
// "Option N:" alternatives and "(optional)" chunks; some units have no active chunks.
describe('courses.getCurriculumMetadata', () => {
  test('typical units: no estimatedTime → null duration; counts only Core exercises; sorted by unitNumber', async () => {
    await seedCourse('typical');
    // Insert out of order to verify sorting by unitNumber.
    await seedUnit('u2', 'typical', '2');
    await seedUnit('u1', 'typical', '1');

    // u1: reading chunks with no time (the common case), referencing two active + one inactive exercise.
    await seedChunk('u1-a', 'u1', { title: 'Welcome', exercises: ['ex-a'] });
    await seedChunk('u1-b', 'u1', { title: 'Core reading', exercises: ['ex-b', 'ex-stale'] });
    // u2: one chunk, no time, no exercises.
    await seedChunk('u2-a', 'u2', { title: 'Discussion prep' });

    await seedExercise('ex-a');
    await seedExercise('ex-b');
    await seedExercise('ex-stale', 'Archived'); // referenced by a chunk but inactive → not counted

    const result = await caller.courses.getCurriculumMetadata({ courseSlug: 'typical' });

    expect(result).toEqual([
      {
        unitId: 'u1', unitNumber: '1', duration: null, exerciseCount: 2,
      },
      {
        unitId: 'u2', unitNumber: '2', duration: null, exerciseCount: 0,
      },
    ]);
  });

  test('duration sums required chunks, takes the max across "Option N:" alternatives, and skips "(optional)"', async () => {
    await seedCourse('options');
    await seedUnit('uo', 'options', '1');

    await seedChunk('uo-read', 'uo', { title: 'Required reading', estimatedTime: 20 });
    await seedChunk('uo-opt1', 'uo', { title: 'Option 1: Faster R&D', estimatedTime: 15 });
    await seedChunk('uo-opt2', 'uo', { title: 'Option 2: Power concentration', estimatedTime: 40 });
    await seedChunk('uo-extra', 'uo', { title: 'Go deeper (optional)', estimatedTime: 30 });

    const result = await caller.courses.getCurriculumMetadata({ courseSlug: 'options' });

    // 20 (required) + max(15, 40) across the two options = 60; the (optional) 30 is excluded.
    expect(result).toEqual([{
      unitId: 'uo', unitNumber: '1', duration: 60, exerciseCount: 0,
    }]);
  });

  test('excludes inactive units and inactive chunks; a unit with no active chunks has null duration', async () => {
    await seedCourse('edges');
    await seedUnit('e-active', 'edges', '1');
    await seedUnit('e-inactive', 'edges', '2', { unitStatus: 'Archived' });
    await seedUnit('e-empty', 'edges', '3');

    await seedChunk('e-a-live', 'e-active', { estimatedTime: 10, status: 'Active' });
    await seedChunk('e-a-dead', 'e-active', { estimatedTime: 99, status: 'Archived' }); // excluded from duration

    const result = await caller.courses.getCurriculumMetadata({ courseSlug: 'edges' });

    expect(result).toEqual([
      {
        unitId: 'e-active', unitNumber: '1', duration: 10, exerciseCount: 0,
      },
      {
        unitId: 'e-empty', unitNumber: '3', duration: null, exerciseCount: 0,
      },
    ]);
  });

  test('a course with no active units returns an empty array', async () => {
    await seedCourse('no-active');
    await seedUnit('na-archived', 'no-active', '1', { unitStatus: 'Archived' });

    const result = await caller.courses.getCurriculumMetadata({ courseSlug: 'no-active' });

    expect(result).toEqual([]);
  });

  test('Core status counts toward the exercise count', async () => {
    await seedCourse('core');
    await seedUnit('uc1', 'core', '1');
    await seedChunk('uc1-a', 'uc1', { title: 'Reading', exercises: ['ex-core'] });
    await seedExercise('ex-core');

    const result = await caller.courses.getCurriculumMetadata({ courseSlug: 'core' });

    expect(result).toEqual([{
      unitId: 'uc1', unitNumber: '1', duration: null, exerciseCount: 1,
    }]);
  });

  test('Further, Maybe, and Inactive statuses are excluded from the exercise count', async () => {
    await seedCourse('nonreq');
    await seedUnit('un1', 'nonreq', '1');
    await seedChunk('un1-a', 'un1', {
      title: 'Reading', exercises: ['ex-further', 'ex-maybe', 'ex-inactive'],
    });
    await seedExercise('ex-further', 'Further');
    await seedExercise('ex-maybe', 'Maybe');
    await seedExercise('ex-inactive', 'Inactive');

    const result = await caller.courses.getCurriculumMetadata({ courseSlug: 'nonreq' });

    expect(result).toEqual([{
      unitId: 'un1', unitNumber: '1', duration: null, exerciseCount: 0,
    }]);
  });
});

describe('courses.getCourseProgress', () => {
  test('Core-status exercises count toward progress', async () => {
    await seedCourse('core-prog');
    await seedUnit('ucp', 'core-prog', '1');
    await seedChunk('ucp-a', 'ucp', { exercises: ['ex-core'] });
    await seedExercise('ex-core');

    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'r-core', email: 'test@example.com', exerciseId: 'ex-core', response: 'x', completedAt: '2026-01-01',
    });

    const { courseProgress } = await caller.courses.getCourseProgress({ courseSlug: 'core-prog' });

    expect(courseProgress).toEqual({ totalCount: 1, completedCount: 1, percentage: 100 });
  });

  test('Further and Maybe statuses count towards neither the total nor completion', async () => {
    await seedCourse('further-prog');
    await seedUnit('ufp', 'further-prog', '1');
    await seedChunk('ufp-a', 'ufp', { exercises: ['ex-req', 'ex-further', 'ex-maybe'] });
    await seedExercise('ex-req');
    await seedExercise('ex-further', 'Further');
    await seedExercise('ex-maybe', 'Maybe');

    // Complete the non-required exercises; they must not move the progress numbers.
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'r-further', email: 'test@example.com', exerciseId: 'ex-further', response: 'x', completedAt: '2026-01-01',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'r-maybe', email: 'test@example.com', exerciseId: 'ex-maybe', response: 'x', completedAt: '2026-01-01',
    });

    const { courseProgress } = await caller.courses.getCourseProgress({ courseSlug: 'further-prog' });

    expect(courseProgress).toEqual({ totalCount: 1, completedCount: 0, percentage: 0 });
  });
});
