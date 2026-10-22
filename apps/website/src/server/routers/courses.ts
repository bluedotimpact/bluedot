import {
  and,
  arrayContains,
  chunkTable,
  courseTable,
  desc,
  eq,
  exerciseResponsePgTable,
  exerciseTable,
  inArray,
  isNotNull,
  isNull,
  ne,
  or,
  resourceCompletionPgTable,
  unitResourceTable,
  unitTable,
  type Chunk,
} from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { removeInactiveChunkIdsFromUnits } from '../../lib/api/utils';
import {
  getUserFromAuthOrThrow, protectedProcedure, publicProcedure, router,
} from '../trpc';

export type BasicChunk = {
  id: string;
  chunkTitle: string;
  chunkOrder: string;
  estimatedTime: number | null;
};

export async function getActiveChunksByUnit(units: { id: string }[]) {
  const unitIds = units.map((u) => u.id);
  const activeChunks = await db.pg
    .select()
    .from(chunkTable.pg)
    .where(and(eq(chunkTable.pg.status, 'Active'), inArray(chunkTable.pg.unitId, unitIds)));

  const result: Record<string, BasicChunk[]> = {};
  for (const u of units) {
    result[u.id] = activeChunks
      .filter((c) => c.unitId === u.id)
      .sort((a, b) => Number(a.chunkOrder) - Number(b.chunkOrder))
      .map((c) => ({
        id: c.id,
        chunkTitle: c.chunkTitle,
        chunkOrder: c.chunkOrder,
        estimatedTime: c.estimatedTime,
      }));
  }

  return result;
}

export type ChunkProgress = {
  totalCount: number;
  completedCount: number;
  allCompleted: boolean;
};
export type CourseAndUnits = inferRouterOutputs<typeof coursesRouter>['getBySlug'];
export type CurriculumMetadata = inferRouterOutputs<typeof coursesRouter>['getCurriculumMetadata'];
export type CourseProgress = inferRouterOutputs<typeof coursesRouter>['getCourseProgress'];

export async function getCourseBySlugOrThrow(courseSlug: string) {
  const courses = await db.scan(courseTable, { slug: courseSlug });

  if (courses.length === 0) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `Course with slug "${courseSlug}" not found.` });
  }

  if (courses.length > 1) {
    throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: `Multiple courses found for slug "${courseSlug}"` });
  }

  return courses[0]!;
}

/**
 * Fetches course data and its associated units by course slug.
 * This function is shared between the tRPC procedure below and getStaticProps/getServerSideProps when needed.
 */
export async function getCourseData(courseSlug: string) {
  const course = await getCourseBySlugOrThrow(courseSlug);

  // Get units for this course with active status, then sort by unit number
  const allUnitsWithAllChunks = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });
  const allUnits = await removeInactiveChunkIdsFromUnits({ units: allUnitsWithAllChunks, db });
  const units = allUnits.sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  return {
    course,
    units,
  };
}

export const getAllActiveCourses = async () => {
  const courses = await db.scan(courseTable, { status: 'Active' });
  return courses;
};

const getUserCompletions = async (coreResourceIds: string[], requiredExerciseIds: string[], userId: string) => {
  const [rawResourceCompletions, rawExerciseCompletions] = await Promise.all([
    db.pg
      .select()
      .from(resourceCompletionPgTable.pg)
      .where(and(
        arrayContains(resourceCompletionPgTable.pg.userId, [userId]),
        inArray(resourceCompletionPgTable.pg.unitResourceId, coreResourceIds),
        isNotNull(resourceCompletionPgTable.pg.completedAt), // Only fetch completed resources
      ))
      .orderBy(desc(resourceCompletionPgTable.pg.createdAt)),

    db.pg
      .select({
        exerciseId: exerciseResponsePgTable.pg.exerciseId,
        completedAt: exerciseResponsePgTable.pg.completedAt,
      })
      .from(exerciseResponsePgTable.pg)
      .where(and(
        arrayContains(exerciseResponsePgTable.pg.userId, [userId]),
        inArray(exerciseResponsePgTable.pg.exerciseId, requiredExerciseIds),
        isNotNull(exerciseResponsePgTable.pg.completedAt), // Only fetch completed exercises
      ))
      .orderBy(desc(exerciseResponsePgTable.pg.createdAt)),
  ]);

  // Deduplicate by unitResourceId, keeping only the first occurrence.
  // Although we should only have one resource completion for a resource per user, it is possible to have multiple
  // (e.g. if a user quickly submits multiple times before the first is saved). We cannot enforce uniqueness in
  // Airtable, so we handle it here.
  const seenResourceIds = new Set<string>();
  const resourceCompletions = rawResourceCompletions.filter((completion) => {
    if (!completion.unitResourceId) {
      return false;
    }

    if (seenResourceIds.has(completion.unitResourceId)) {
      return false;
    }

    seenResourceIds.add(completion.unitResourceId);
    return true;
  });

  // Deduplicate exercises
  const seenExerciseIds = new Set<string>();
  const exerciseCompletions = rawExerciseCompletions.filter((response) => {
    if (seenExerciseIds.has(response.exerciseId)) {
      return false;
    }

    seenExerciseIds.add(response.exerciseId);
    return true;
  });

  return { resourceCompletions, exerciseCompletions };
};

const calculateChunkProgress = (
  chunk: Chunk,
  coreResourceIds: Set<string>,
  requiredExerciseIds: Set<string>,
  completedResourceIds: Set<string>,
  completedExerciseIds: Set<string>,
) => {
  const chunkResourceIds = chunk.chunkResources?.filter((id) => coreResourceIds.has(id)) ?? [];
  const chunkExerciseIds = chunk.chunkExercises?.filter((id) => requiredExerciseIds.has(id)) ?? [];

  const chunkCompletedResources = chunkResourceIds.filter((id) => completedResourceIds.has(id));
  const chunkCompletedExercises = chunkExerciseIds.filter((id) => completedExerciseIds.has(id));

  const totalCount = chunkResourceIds.length + chunkExerciseIds.length;
  const completedCount = chunkCompletedResources.length + chunkCompletedExercises.length;

  return {
    totalCount,
    completedCount,
    allCompleted: totalCount > 0 && completedCount === totalCount,
  };
};

// Project submissions are handed in through an external form and have no completion action on
// the page, so counting them would hold every learner one short of 100%.
const countsTowardProgress = or(
  isNull(exerciseTable.pg.type),
  ne(exerciseTable.pg.type, 'Project submission'),
);

const getCoreResourceAndRequiredExerciseIds = async (chunks: Chunk[]) => {
  const allResourceIds = chunks.flatMap((c) => c.chunkResources ?? []);
  const allExerciseIds = chunks.flatMap((c) => c.chunkExercises ?? []);

  const coreResources = await db.pg
    .select({ id: unitResourceTable.pg.id })
    .from(unitResourceTable.pg)
    .where(and(eq(unitResourceTable.pg.coreFurtherMaybe, 'Core'), inArray(unitResourceTable.pg.id, allResourceIds)));
  const coreResourceIds = coreResources.map((r) => r.id);

  const requiredExercises = await db.pg
    .select({ id: exerciseTable.pg.id })
    .from(exerciseTable.pg)
    .where(and(
      eq(exerciseTable.pg.status, 'Core'),
      inArray(exerciseTable.pg.id, allExerciseIds),
      countsTowardProgress,
    ));
  const requiredExerciseIds = requiredExercises.map((e) => e.id);

  return { coreResourceIds, requiredExerciseIds };
};

// Chunks with "Optional" in the title aren't required. "Option N" chunks in a unit are
// alternatives (learners do one). The duration estimate and course progress both use these.
// Check isOptionalChunk first: "Option 1 (optional)" is optional.
const isOptionalChunk = (chunk: Pick<Chunk, 'chunkTitle'>) => /optional/i.test(chunk.chunkTitle);
const isOptionChunk = (chunk: Pick<Chunk, 'chunkTitle'>) => /option\s+\d+/i.test(chunk.chunkTitle);

// The total counts every required item outside Optional chunks, plus one option per unit: the
// option the learner has done the largest share of (the largest one before any is started).
// Every completed required item counts as done, including items in Optional chunks and in other
// options, capped at the total. So extra work can only raise the percentage.
// isComplete: every counted item is done, so every regular item and one full option per unit.
// Only then is the course at 100%.
export const countCourseProgress = (
  chunksByUnit: Pick<Chunk, 'chunkTitle' | 'chunkResources' | 'chunkExercises'>[][],
  requiredIds: Set<string>,
  completedIds: Set<string>,
) => {
  type CourseChunk = (typeof chunksByUnit)[number][number];
  const requiredIdsIn = (chunk: CourseChunk) => [...(chunk.chunkResources ?? []), ...(chunk.chunkExercises ?? [])]
    .filter((id) => requiredIds.has(id));
  const requiredChunksByUnit = chunksByUnit.map((chunks) => chunks.filter((c) => !isOptionalChunk(c)));

  // Items outside Option chunks always count, once, even if they also appear in an option.
  const regularIds = new Set(requiredChunksByUnit.flat().filter((c) => !isOptionChunk(c)).flatMap(requiredIdsIn));
  const countedIds = new Set(regularIds);

  for (const chunks of requiredChunksByUnit) {
    const options = chunks
      .filter(isOptionChunk)
      .map((c) => {
        const ids = [...new Set(requiredIdsIn(c))].filter((id) => !regularIds.has(id));
        return { ids, share: ids.filter((id) => completedIds.has(id)).length / ids.length };
      })
      .filter((o) => o.ids.length > 0);

    if (options.length > 0) {
      const counted = options.reduce((best, o) => (
        o.share > best.share || (o.share === best.share && o.ids.length > best.ids.length) ? o : best
      ));
      counted.ids.forEach((id) => countedIds.add(id));
    }
  }

  const totalCount = countedIds.size;
  const isComplete = totalCount > 0 && [...countedIds].every((id) => completedIds.has(id));
  const completedCount = isComplete
    ? totalCount
    : Math.min(totalCount, [...requiredIds].filter((id) => completedIds.has(id)).length);
  return { totalCount, completedCount, isComplete };
};

// 100% means the course is finished. Bonus work can reach the total without finishing it, and
// 99.6% would round to 100, so an unfinished course shows at most 99%.
const coursePercentage = (completedCount: number, totalCount: number, isComplete: boolean) => {
  if (totalCount === 0) return 0;
  return isComplete ? 100 : Math.min(99, Math.round((completedCount / totalCount) * 100));
};

export const coursesRouter = router({
  getUnit: publicProcedure
    .input(z.object({
      courseSlug: z.string().trim().min(1, 'courseSlug is required'),
      unitId: z.string().trim().min(1, 'unitId is required'),
    }))
    .query(async ({ input }) => {
      const { courseSlug, unitId } = input;

      return db.getFirst(unitTable, {
        filter: {
          id: unitId,
          courseSlug,
          unitStatus: 'Active',
        },
        sortBy: 'id',
      });
    }),

  getBySlug: publicProcedure
    .input(z.object({
      courseSlug: z.string().min(1),
    }))
    .query(async ({ input: { courseSlug } }) => {
      return getCourseData(courseSlug);
    }),

  getAll: publicProcedure
    .query(async () => {
      return getAllActiveCourses();
    }),

  getCurriculumMetadata: publicProcedure
    .input(z.object({
      courseSlug: z.string().min(1),
    }))
    .query(async ({ input: { courseSlug } }) => {
      await getCourseBySlugOrThrow(courseSlug);

      // 1. Fetch data
      const allUnits = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });
      const unitIds = allUnits.map((u) => u.id);

      const allChunks = unitIds.length > 0
        ? await db.pg
          .select()
          .from(chunkTable.pg)
          .where(and(eq(chunkTable.pg.status, 'Active'), inArray(chunkTable.pg.unitId, unitIds)))
        : [];

      const referencedExerciseIds = allChunks.flatMap((c) => c.chunkExercises ?? []);
      const requiredExerciseIds = new Set<string>();
      if (referencedExerciseIds.length > 0) {
        const requiredExercises = await db.pg
          .select({ id: exerciseTable.pg.id })
          .from(exerciseTable.pg)
          .where(and(
            eq(exerciseTable.pg.status, 'Core'),
            inArray(exerciseTable.pg.id, referencedExerciseIds),
            countsTowardProgress,
          ));
        for (const e of requiredExercises) requiredExerciseIds.add(e.id);
      }

      // Calculate duration:
      // - Skip chunks with "Optional" in title (not required)
      // - For "Option N:" chunks, take max (they are alternatives)
      // - Sum the rest
      const unitMetadata = allUnits.map((unit) => {
        const chunks = allChunks.filter((c) => c.unitId === unit.id);

        const requiredChunks = chunks.filter((c) => !isOptionalChunk(c));
        const optionChunks = requiredChunks.filter(isOptionChunk);
        const regularChunks = requiredChunks.filter((c) => !isOptionChunk(c));
        const optionMaxTime = optionChunks.length > 0
          ? Math.max(...optionChunks.map((c) => c.estimatedTime ?? 0))
          : 0;
        const regularTime = regularChunks.reduce((sum, c) => sum + (c.estimatedTime ?? 0), 0);
        const totalDuration = regularTime + optionMaxTime;

        const exerciseCount = [...new Set(chunks.flatMap((c) => c.chunkExercises ?? []))]
          .filter((id) => requiredExerciseIds.has(id)).length;

        return {
          unitId: unit.id,
          unitNumber: unit.unitNumber,
          duration: totalDuration > 0 ? totalDuration : null,
          exerciseCount,
        };
      });

      return unitMetadata.sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));
    }),

  getCourseProgress: protectedProcedure
    .input(z.object({ courseSlug: z.string().min(1) }))
    .query(async ({ input: { courseSlug }, ctx }) => {
      const { units } = await getCourseData(courseSlug);
      const unitIds = units.map((u) => u.id);

      const allChunks = await db.pg
        .select()
        .from(chunkTable.pg)
        .where(and(eq(chunkTable.pg.status, 'Active'), inArray(chunkTable.pg.unitId, unitIds)));

      const { coreResourceIds, requiredExerciseIds } = await getCoreResourceAndRequiredExerciseIds(allChunks);

      const user = await getUserFromAuthOrThrow(ctx.auth);

      const { resourceCompletions, exerciseCompletions } = await getUserCompletions(
        coreResourceIds,
        requiredExerciseIds,
        user.id,
      );

      // Build Sets for faster lookup
      const coreResourceIdSet = new Set(coreResourceIds);
      const requiredExerciseIdSet = new Set(requiredExerciseIds);
      const completedResourceIdSet = new Set(resourceCompletions.map((c) => c.unitResourceId).filter((id): id is string => id != null));
      const completedExerciseIdSet = new Set(exerciseCompletions.map((e) => e.exerciseId));

      const chunkProgressByUnitNumber: Record<string, (ChunkProgress & { isOptionOrOptional: boolean })[]> = {};

      for (const unit of units) {
        const unitChunks = allChunks
          .filter((c) => c.unitId === unit.id)
          .sort((a, b) => Number(a.chunkOrder) - Number(b.chunkOrder));
        chunkProgressByUnitNumber[unit.unitNumber] = unitChunks.map((chunk) => ({
          ...calculateChunkProgress(
            chunk,
            coreResourceIdSet,
            requiredExerciseIdSet,
            completedResourceIdSet,
            completedExerciseIdSet,
          ),
          // Tells the client a toggle here may not move the course count by exactly one
          isOptionOrOptional: isOptionalChunk(chunk) || isOptionChunk(chunk),
        }));
      }

      const requiredIdSet = new Set([...coreResourceIds, ...requiredExerciseIds]);
      const completedIdSet = new Set([...completedResourceIdSet, ...completedExerciseIdSet]);
      const { totalCount: courseTotalCount, completedCount: courseCompletedCount, isComplete } = countCourseProgress(
        units.map((unit) => allChunks.filter((c) => c.unitId === unit.id)),
        requiredIdSet,
        completedIdSet,
      );
      const percentage = coursePercentage(courseCompletedCount, courseTotalCount, isComplete);

      return {
        courseProgress: {
          totalCount: courseTotalCount,
          completedCount: courseCompletedCount,
          percentage,
        },
        chunkProgressByUnitNumber,
      };
    }),
});
