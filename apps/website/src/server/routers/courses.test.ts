import {
  chunkTable,
  courseTable,
  exerciseResponsePgTable,
  exerciseTable,
  unitTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { describe, expect, test } from 'vitest';
import {
  createCaller,
  seedLoggedInUser,
  setupTestDb,
  testAuthContextLoggedIn,
  testDb,
} from '../../__tests__/dbTestUtils';
import { countCourseProgress } from './courses';

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

const seedExercise = (id: string, status = 'Core', type = 'Free text') => testDb.insert(exerciseTable, { id, status, type });

describe('courses.getBySlug', () => {
  test('returns the course for a known slug', async () => {
    await seedCourse('known');

    const result = await caller.courses.getBySlug({ courseSlug: 'known' });

    expect(result.course.slug).toBe('known');
    expect(result.units).toEqual([]);
  });

  test('throws NOT_FOUND for an unknown slug', async () => {
    const promise = caller.courses.getBySlug({ courseSlug: 'does-not-exist' });

    await expect(promise).rejects.toBeInstanceOf(TRPCError);
    await expect(promise).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });

  // Slugs are hand-authored in Airtable with no uniqueness constraint; a collision must fail
  // loudly rather than render an arbitrary one of the matching courses.
  test('throws INTERNAL_SERVER_ERROR when two courses share a slug', async () => {
    await testDb.insert(courseTable, {
      id: 'course-dupe-1', slug: 'dupe', title: 'dupe 1', shortDescription: 'd', units: [], status: 'Active',
    });
    await testDb.insert(courseTable, {
      id: 'course-dupe-2', slug: 'dupe', title: 'dupe 2', shortDescription: 'd', units: [], status: 'Active',
    });

    await expect(caller.courses.getBySlug({ courseSlug: 'dupe' }))
      .rejects.toMatchObject({ code: 'INTERNAL_SERVER_ERROR' });
  });
});

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

  test('throws NOT_FOUND for an unknown slug', async () => {
    await expect(caller.courses.getCurriculumMetadata({ courseSlug: 'does-not-exist' }))
      .rejects.toMatchObject({ code: 'NOT_FOUND' });
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
  test('a unit\'s Option sections count as one: finishing one option reaches 100%', async () => {
    await seedLoggedInUser();
    await seedCourse('options-prog');
    await seedUnit('uop', 'options-prog', '1');
    await seedChunk('uop-intro', 'uop', { title: 'Introduction', exercises: ['ex-intro'] });
    await seedChunk('uop-1', 'uop', { title: 'Option 1: Anthropic', exercises: ['ex-opt1'] });
    await seedChunk('uop-2', 'uop', { title: 'Option 2: OpenAI', exercises: ['ex-opt2'] });
    await seedExercise('ex-intro');
    await seedExercise('ex-opt1');
    await seedExercise('ex-opt2');

    const before = await caller.courses.getCourseProgress({ courseSlug: 'options-prog' });
    expect(before.courseProgress).toEqual({ totalCount: 2, completedCount: 0, percentage: 0 });

    await testDb.pg.insert(exerciseResponsePgTable.pg).values([
      {
        id: 'r-intro', userId: ['test-user'], exerciseId: 'ex-intro', response: 'x', completedAt: '2026-01-01',
      },
      {
        id: 'r-opt2', userId: ['test-user'], exerciseId: 'ex-opt2', response: 'x', completedAt: '2026-01-01',
      },
    ]);

    const after = await caller.courses.getCourseProgress({ courseSlug: 'options-prog' });
    expect(after.courseProgress).toEqual({ totalCount: 2, completedCount: 2, percentage: 100 });
  });

  test('work in an Optional chunk does not change the %', async () => {
    await seedLoggedInUser();
    await seedCourse('optional-prog');
    await seedUnit('uopl', 'optional-prog', '1');
    await seedChunk('uopl-intro', 'uopl', { title: 'Introduction', exercises: ['ex-main-1', 'ex-main-2'] });
    await seedChunk('uopl-extra', 'uopl', { title: '[Optional] Biology 101', exercises: ['ex-extra'] });
    await seedExercise('ex-main-1');
    await seedExercise('ex-main-2');
    await seedExercise('ex-extra');
    const complete = (exerciseId: string) => testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: `r-${exerciseId}`, userId: ['test-user'], exerciseId, response: 'x', completedAt: '2026-01-01',
    });

    await complete('ex-extra');
    const optionalOnly = await caller.courses.getCourseProgress({ courseSlug: 'optional-prog' });
    expect(optionalOnly.courseProgress).toEqual({ totalCount: 2, completedCount: 0, percentage: 0 });

    await complete('ex-main-1');
    const half = await caller.courses.getCourseProgress({ courseSlug: 'optional-prog' });
    expect(half.courseProgress).toEqual({ totalCount: 2, completedCount: 1, percentage: 50 });

    await complete('ex-main-2');
    const finished = await caller.courses.getCourseProgress({ courseSlug: 'optional-prog' });
    expect(finished.courseProgress).toEqual({ totalCount: 2, completedCount: 2, percentage: 100 });
    expect(finished.chunkProgressByUnitNumber['1']?.map((c) => c.isOptionOrOptional)).toEqual([false, true]);
  });

  test('doing a second option does not raise the %', async () => {
    await seedLoggedInUser();
    await seedCourse('switch-prog');
    await seedUnit('usw', 'switch-prog', '1');
    await seedChunk('usw-intro', 'usw', { title: 'Introduction', exercises: ['r1', 'r2', 'r3', 'r4'] });
    await seedChunk('usw-1', 'usw', { title: 'Option 1: Long', exercises: ['a1', 'a2', 'a3'] });
    await seedChunk('usw-2', 'usw', { title: 'Option 2: Short', exercises: ['b1'] });
    await Promise.all(['r1', 'r2', 'r3', 'r4', 'a1', 'a2', 'a3', 'b1'].map((id) => seedExercise(id)));
    const complete = (exerciseId: string) => testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: `r-${exerciseId}`, userId: ['test-user'], exerciseId, response: 'x', completedAt: '2026-01-01',
    });

    await Promise.all(['r1', 'a1', 'a2', 'a3'].map(complete));
    const oneOption = await caller.courses.getCourseProgress({ courseSlug: 'switch-prog' });
    expect(oneOption.courseProgress).toEqual({ totalCount: 7, completedCount: 4, percentage: 57 });

    await complete('b1');
    const twoOptions = await caller.courses.getCourseProgress({ courseSlug: 'switch-prog' });
    expect(twoOptions.courseProgress).toEqual({ totalCount: 7, completedCount: 4, percentage: 57 });
  });

  test('Optional and second-option work never make up for a missed regular item', async () => {
    await seedLoggedInUser();
    await seedCourse('missed-prog');
    await seedUnit('ums', 'missed-prog', '1');
    await seedChunk('ums-intro', 'ums', { title: 'Introduction', exercises: ['m-r1', 'm-r2'] });
    await seedChunk('ums-1', 'ums', { title: 'Option 1: Anthropic', exercises: ['m-a1'] });
    await seedChunk('ums-2', 'ums', { title: 'Option 2: OpenAI', exercises: ['m-b1'] });
    await seedChunk('ums-extra', 'ums', { title: '[Optional] Extra reading', exercises: ['m-o1'] });
    await Promise.all(['m-r1', 'm-r2', 'm-a1', 'm-b1', 'm-o1'].map((id) => seedExercise(id)));
    const complete = (exerciseId: string) => testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: `r-${exerciseId}`, userId: ['test-user'], exerciseId, response: 'x', completedAt: '2026-01-01',
    });

    // Everything but the regular item m-r2
    await Promise.all(['m-r1', 'm-a1', 'm-b1', 'm-o1'].map(complete));
    const missed = await caller.courses.getCourseProgress({ courseSlug: 'missed-prog' });
    expect(missed.courseProgress).toEqual({ totalCount: 3, completedCount: 2, percentage: 67 });

    await complete('m-r2');
    const finished = await caller.courses.getCourseProgress({ courseSlug: 'missed-prog' });
    expect(finished.courseProgress).toEqual({ totalCount: 3, completedCount: 3, percentage: 100 });
  });

  test('an unfinished course never rounds up to 100%', async () => {
    await seedLoggedInUser();
    await seedCourse('long-prog');
    await seedUnit('ulong', 'long-prog', '1');
    const ids = Array.from({ length: 200 }, (_, i) => `long-${i}`);
    await seedChunk('ulong-1', 'ulong', { title: 'Reading', exercises: ids });
    await Promise.all(ids.map((id) => seedExercise(id)));
    const complete = (exerciseIds: string[]) => testDb.pg.insert(exerciseResponsePgTable.pg).values(exerciseIds.map((exerciseId) => ({
      id: `r-${exerciseId}`, userId: ['test-user'], exerciseId, response: 'x', completedAt: '2026-01-01',
    })));

    // 199 of 200 is 99.5%, which Math.round would show as 100
    await complete(ids.slice(0, 199));
    const almost = await caller.courses.getCourseProgress({ courseSlug: 'long-prog' });
    expect(almost.courseProgress).toEqual({ totalCount: 200, completedCount: 199, percentage: 99 });

    await complete(ids.slice(199));
    const finished = await caller.courses.getCourseProgress({ courseSlug: 'long-prog' });
    expect(finished.courseProgress).toEqual({ totalCount: 200, completedCount: 200, percentage: 100 });
  });

  test('every regular item plus one full option per unit is 100%', async () => {
    await seedLoggedInUser();
    await seedCourse('paths-prog');
    await seedUnit('upa1', 'paths-prog', '1');
    await seedUnit('upa2', 'paths-prog', '2');
    await seedChunk('upa1-intro', 'upa1', { title: 'Introduction', exercises: ['p-r1'] });
    await seedChunk('upa1-1', 'upa1', { title: 'Option 1: Labs', exercises: ['p-a1', 'p-a2'] });
    await seedChunk('upa1-2', 'upa1', { title: 'Option 2: Policy', exercises: ['p-b1'] });
    await seedChunk('upa2-intro', 'upa2', { title: 'Introduction', exercises: ['p-r2'] });
    await seedChunk('upa2-1', 'upa2', { title: 'Option 1: Labs', exercises: ['p-c1'] });
    await seedChunk('upa2-2', 'upa2', { title: 'Option 2: Policy', exercises: ['p-d1', 'p-d2'] });
    await Promise.all(['p-r1', 'p-a1', 'p-a2', 'p-b1', 'p-r2', 'p-c1', 'p-d1', 'p-d2'].map((id) => seedExercise(id)));
    const complete = (exerciseId: string) => testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: `r-${exerciseId}`, userId: ['test-user'], exerciseId, response: 'x', completedAt: '2026-01-01',
    });

    await Promise.all(['p-r1', 'p-a1', 'p-a2', 'p-r2', 'p-d1'].map(complete));
    const oneOptionLeft = await caller.courses.getCourseProgress({ courseSlug: 'paths-prog' });
    expect(oneOptionLeft.courseProgress).toEqual({ totalCount: 6, completedCount: 5, percentage: 83 });

    await complete('p-d2');
    const finished = await caller.courses.getCourseProgress({ courseSlug: 'paths-prog' });
    expect(finished.courseProgress).toEqual({ totalCount: 6, completedCount: 6, percentage: 100 });
  });

  test('Core-status exercises count toward progress', async () => {
    await seedLoggedInUser();
    await seedCourse('core-prog');
    await seedUnit('ucp', 'core-prog', '1');
    await seedChunk('ucp-a', 'ucp', { exercises: ['ex-core'] });
    await seedExercise('ex-core');

    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'r-core', userId: ['test-user'], exerciseId: 'ex-core', response: 'x', completedAt: '2026-01-01',
    });

    const { courseProgress } = await caller.courses.getCourseProgress({ courseSlug: 'core-prog' });

    expect(courseProgress).toEqual({ totalCount: 1, completedCount: 1, percentage: 100 });
  });

  test('Further and Maybe statuses count towards neither the total nor completion', async () => {
    await seedLoggedInUser();
    await seedCourse('further-prog');
    await seedUnit('ufp', 'further-prog', '1');
    await seedChunk('ufp-a', 'ufp', { exercises: ['ex-req', 'ex-further', 'ex-maybe'] });
    await seedExercise('ex-req');
    await seedExercise('ex-further', 'Further');
    await seedExercise('ex-maybe', 'Maybe');

    // Complete the non-required exercises; they must not move the progress numbers.
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'r-further', userId: ['test-user'], exerciseId: 'ex-further', response: 'x', completedAt: '2026-01-01',
    });
    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'r-maybe', userId: ['test-user'], exerciseId: 'ex-maybe', response: 'x', completedAt: '2026-01-01',
    });

    const { courseProgress } = await caller.courses.getCourseProgress({ courseSlug: 'further-prog' });

    expect(courseProgress).toEqual({ totalCount: 1, completedCount: 0, percentage: 0 });
  });

  test('Project submission exercises count towards neither the total nor completion', async () => {
    await seedLoggedInUser();
    await seedCourse('submission-prog');
    await seedUnit('usp', 'submission-prog', '1');
    await seedChunk('usp-a', 'usp', { exercises: ['ex-req', 'ex-submission'] });
    await seedExercise('ex-req');
    await seedExercise('ex-submission', 'Core', 'Project submission');

    await testDb.pg.insert(exerciseResponsePgTable.pg).values({
      id: 'r-req', userId: ['test-user'], exerciseId: 'ex-req', response: 'x', completedAt: '2026-01-01',
    });

    const { courseProgress } = await caller.courses.getCourseProgress({ courseSlug: 'submission-prog' });

    expect(courseProgress).toEqual({ totalCount: 1, completedCount: 1, percentage: 100 });
  });

  test('Project submission exercises are left out of the curriculum exercise count too', async () => {
    await seedCourse('metadata-prog');
    await seedUnit('ump', 'metadata-prog', '1');
    await seedChunk('ump-a', 'ump', { exercises: ['ex-req', 'ex-submission'] });
    await seedExercise('ex-req');
    await seedExercise('ex-submission', 'Core', 'Project submission');

    const result = await caller.courses.getCurriculumMetadata({ courseSlug: 'metadata-prog' });

    expect(result).toEqual([{
      unitId: 'ump', unitNumber: '1', duration: null, exerciseCount: 1,
    }]);
  });

  test('exercises with no type set still count towards progress', async () => {
    await seedLoggedInUser();
    await seedCourse('untyped-prog');
    await seedUnit('uup', 'untyped-prog', '1');
    await seedChunk('uup-a', 'uup', { exercises: ['ex-untyped'] });
    await testDb.insert(exerciseTable, { id: 'ex-untyped', status: 'Core' });

    const { courseProgress } = await caller.courses.getCourseProgress({ courseSlug: 'untyped-prog' });

    expect(courseProgress).toEqual({ totalCount: 1, completedCount: 0, percentage: 0 });
  });
});

describe('countCourseProgress', () => {
  const chunk = (chunkTitle: string, chunkResources: string[], chunkExercises: string[] = []) => ({ chunkTitle, chunkResources, chunkExercises });

  test('counts the option with the largest share done, and the largest option before any is started', () => {
    const units = [[
      chunk('Reading', ['r1']),
      chunk('Option 1: Short', ['a1']),
      chunk('Option 2: Long', ['b1', 'b2', 'b3']),
    ]];
    const required = new Set(['r1', 'a1', 'b1', 'b2', 'b3']);

    expect(countCourseProgress(units, required, new Set())).toEqual({ totalCount: 4, completedCount: 0 });
    expect(countCourseProgress(units, required, new Set(['a1']))).toEqual({ totalCount: 2, completedCount: 1 });
    expect(countCourseProgress(units, required, new Set(['b1']))).toEqual({ totalCount: 4, completedCount: 1 });
  });

  test('switches to the option the learner has done more of, and does not count the other option', () => {
    const units = [[chunk('Option 1: Short', ['a1', 'a2']), chunk('Option 2: Long', ['b1', 'b2', 'b3'])]];
    const required = new Set(['a1', 'a2', 'b1', 'b2', 'b3']);

    expect(countCourseProgress(units, required, new Set(['b1']))).toEqual({ totalCount: 3, completedCount: 1 });
    expect(countCourseProgress(units, required, new Set(['b1', 'a1']))).toEqual({ totalCount: 2, completedCount: 1 });
    expect(countCourseProgress(units, required, new Set(['b1', 'b2', 'a1', 'a2']))).toEqual({ totalCount: 2, completedCount: 2 });
  });

  test('items in Optional chunks count in neither the total nor the done count', () => {
    const units = [[chunk('Reading', ['r1', 'r2']), chunk('Optional reading', ['o1', 'o2', 'o3'])]];
    const required = new Set(['r1', 'r2', 'o1', 'o2', 'o3']);

    expect(countCourseProgress(units, required, new Set(['o1']))).toEqual({ totalCount: 2, completedCount: 0 });
    expect(countCourseProgress(units, required, new Set(['r1', 'o1', 'o2', 'o3']))).toEqual({ totalCount: 2, completedCount: 1 });
  });

  test('skips chunks titled Optional, and only counts "Option <number>" chunks as options', () => {
    const units = [[
      chunk('Optional reading', ['o1']),
      chunk('Option 1 (optional)', ['o2']),
      chunk('Option A: Policy', ['r1']),
      chunk('Option 1: Short', ['a1']),
      chunk('Option 2: Long', ['b1']),
    ]];
    const required = new Set(['o1', 'o2', 'r1', 'a1', 'b1']);

    expect(countCourseProgress(units, required, new Set(['r1', 'b1']))).toEqual({ totalCount: 2, completedCount: 2 });
  });

  test('an item in an option that is also a regular item in another unit still counts', () => {
    const units = [
      [chunk('Option 1: A', ['a']), chunk('Option 2: X', ['x'])],
      [chunk('Reading', ['x', 'r'])],
    ];

    expect(countCourseProgress(units, new Set(['a', 'x', 'r']), new Set())).toEqual({ totalCount: 3, completedCount: 0 });
  });

  test('counts a resource shared by two units once', () => {
    const units = [[chunk('Reading', ['shared'])], [chunk('Reading', ['shared'])]];

    expect(countCourseProgress(units, new Set(['shared']), new Set(['shared']))).toEqual({ totalCount: 1, completedCount: 1 });
  });

  test('ignores items that are not required', () => {
    const units = [[chunk('Reading', ['core', 'further'])]];

    expect(countCourseProgress(units, new Set(['core']), new Set(['further']))).toEqual({ totalCount: 1, completedCount: 0 });
  });
});
