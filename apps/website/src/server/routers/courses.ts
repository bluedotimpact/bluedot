import {
  and,
  chunkTable,
  courseTable,
  desc,
  eq,
  exerciseResponseTable,
  exerciseTable,
  inArray,
  resourceCompletionTable,
  unitResourceTable,
  unitTable,
  type Chunk,
} from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { removeInactiveChunkIdsFromUnits } from '../../lib/api/utils';
import { protectedProcedure, publicProcedure, router } from '../trpc';

export type ChunkProgress = {
  totalCount: number;
  completedCount: number;
  allCompleted: boolean;
};
export type CourseAndUnits = inferRouterOutputs<typeof coursesRouter>['getBySlug'];
export type CurriculumMetadata = inferRouterOutputs<typeof coursesRouter>['getCurriculumMetadata'];
export type CourseProgress = inferRouterOutputs<typeof coursesRouter>['getCourseProgress'];

/**
 * Fetches course data and its associated units by course slug.
 * This function is shared between the tRPC procedure below and getStaticProps/getServerSideProps when needed.
 */
export async function getCourseData(courseSlug: string) {
  const course = await db.get(courseTable, { slug: courseSlug });

  if (!course) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `Course with slug "${courseSlug}" not found.` });
  }

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

const getUserCompletions = async (coreResourceIds: string[], activeExerciseIds: string[], email: string) => {
  const [rawResourceCompletions, rawExerciseCompletions] = await Promise.all([
    db.pg
      .select()
      .from(resourceCompletionTable.pg)
      .where(
        and(
          eq(resourceCompletionTable.pg.email, email),
          inArray(resourceCompletionTable.pg.unitResourceId, coreResourceIds),
          eq(resourceCompletionTable.pg.isCompleted, true), // Only fetch completed resources
        ),
      )
      .orderBy(desc(resourceCompletionTable.pg.autoNumberId)),

    db.pg
      .select({
        exerciseId: exerciseResponseTable.pg.exerciseId,
        completed: exerciseResponseTable.pg.completed,
      })
      .from(exerciseResponseTable.pg)
      .where(
        and(
          eq(exerciseResponseTable.pg.email, email),
          inArray(exerciseResponseTable.pg.exerciseId, activeExerciseIds),
          eq(exerciseResponseTable.pg.completed, true), // Only fetch completed exercises
        ),
      )
      .orderBy(desc(exerciseResponseTable.pg.autoNumberId)),
  ]);

  // Deduplicate by unitResourceId, keeping only the first occurrence.
  // Although we should only have one resource completion for a resource per user, it is possible to have multiple
  // (e.g. if a user quickly submits multiple times before the first is saved). We cannot enforce uniqueness in
  // Airtable, so we handle it here.
  const seenResourceIds = new Set<string>();
  const resourceCompletions = rawResourceCompletions.filter((completion) => {
    if (!completion.unitResourceId) return false;
    if (seenResourceIds.has(completion.unitResourceId)) return false;
    seenResourceIds.add(completion.unitResourceId);
    return true;
  });

  // Deduplicate exercises
  const seenExerciseIds = new Set<string>();
  const exerciseCompletions = rawExerciseCompletions.filter((response) => {
    if (seenExerciseIds.has(response.exerciseId)) return false;
    seenExerciseIds.add(response.exerciseId);
    return true;
  });

  return { resourceCompletions, exerciseCompletions };
};

const calculateChunkProgress = (
  chunk: Chunk,
  coreResourceIds: Set<string>,
  activeExerciseIds: Set<string>,
  completedResourceIds: Set<string>,
  completedExerciseIds: Set<string>,
) => {
  const chunkResourceIds = chunk.chunkResources?.filter((id) => coreResourceIds.has(id)) ?? [];
  const chunkExerciseIds = chunk.chunkExercises?.filter((id) => activeExerciseIds.has(id)) ?? [];

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

const getCoreResourceAndActiveExerciseIds = async (chunks: Chunk[]) => {
  const allResourceIds = chunks.flatMap((c) => c.chunkResources ?? []);
  const allExerciseIds = chunks.flatMap((c) => c.chunkExercises ?? []);

  const coreResources = await db.pg
    .select({ id: unitResourceTable.pg.id })
    .from(unitResourceTable.pg)
    .where(
      and(eq(unitResourceTable.pg.coreFurtherMaybe, 'Core'), inArray(unitResourceTable.pg.id, allResourceIds)),
    );
  const coreResourceIds = coreResources.map((r) => r.id);

  const activeExercises = await db.pg
    .select({ id: exerciseTable.pg.id })
    .from(exerciseTable.pg)
    .where(and(eq(exerciseTable.pg.status, 'Active'), inArray(exerciseTable.pg.id, allExerciseIds)));
  const activeExerciseIds = activeExercises.map((e) => e.id);

  return { coreResourceIds, activeExerciseIds };
};

export const coursesRouter = router({
  getUnit: publicProcedure
    .input(
      z.object({
        courseSlug: z.string().trim().min(1, 'courseSlug is required'),
        unitId: z.string().trim().min(1, 'unitId is required'),
      }),
    )
    .query(async ({ input }) => {
      const { courseSlug, unitId } = input;

      const unit = await db.getFirst(unitTable, {
        filter: {
          id: unitId,
          courseSlug,
          unitStatus: 'Active',
        },
      });

      if (!unit) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' });
      }

      return unit;
    }),

  getBySlug: publicProcedure
    .input(
      z.object({
        courseSlug: z.string(),
      }),
    )
    .query(async ({ input: { courseSlug } }) => {
      return getCourseData(courseSlug);
    }),

  getAll: publicProcedure
    .query(async () => {
      return getAllActiveCourses();
    }),

  getCurriculumMetadata: publicProcedure
    .input(
      z.object({
        courseSlug: z.string(),
      }),
    )
    .query(async ({ input: { courseSlug } }) => {
      const course = await db.get(courseTable, { slug: courseSlug });
      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Course "${courseSlug}" not found` });
      }

      const allUnits = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });

      // Fetch chunks by unitId (matching course page behavior) instead of using unit.chunks array
      const unitMetadata = await Promise.all(
        allUnits.map(async (unit) => {
          const chunks = await db.scan(chunkTable, { unitId: unit.id, status: 'Active' });

          // Calculate duration:
          // - Skip chunks with "Optional" in title (not required)
          // - For "Option N:" chunks, take max (they're alternatives)
          // - Sum the rest
          const optionPattern = /option\s+\d+/i;
          const optionalPattern = /optional/i;

          const requiredChunks = chunks.filter((c) => !optionalPattern.test(c.chunkTitle));
          const optionChunks = requiredChunks.filter((c) => optionPattern.test(c.chunkTitle));
          const regularChunks = requiredChunks.filter((c) => !optionPattern.test(c.chunkTitle));

          const optionMaxTime = optionChunks.length > 0
            ? Math.max(...optionChunks.map((c) => c.estimatedTime ?? 0))
            : 0;
          const regularTime = regularChunks.reduce((sum, c) => sum + (c.estimatedTime ?? 0), 0);
          const totalDuration = regularTime + optionMaxTime;

          // Get all exercise IDs from active chunks
          const allExerciseIds = chunks.flatMap((c) => c.chunkExercises ?? []);

          // Count only active exercises
          let exerciseCount = 0;
          if (allExerciseIds.length > 0) {
            const activeExercises = await db.pg
              .select({ id: exerciseTable.pg.id })
              .from(exerciseTable.pg)
              .where(
                and(
                  eq(exerciseTable.pg.status, 'Active'),
                  inArray(exerciseTable.pg.id, allExerciseIds),
                ),
              );
            exerciseCount = activeExercises.length;
          }

          return {
            unitId: unit.id,
            unitNumber: unit.unitNumber,
            duration: totalDuration > 0 ? totalDuration : null,
            exerciseCount,
          };
        }),
      );

      return unitMetadata.sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));
    }),

  getCourseProgress: protectedProcedure
    .input(z.object({ courseSlug: z.string() }))
    .query(async ({ input: { courseSlug }, ctx }) => {
      const { units } = await getCourseData(courseSlug);
      const unitIds = units.map((u) => u.id);

      const allChunks = await db.pg
        .select()
        .from(chunkTable.pg)
        .where(and(eq(chunkTable.pg.status, 'Active'), inArray(chunkTable.pg.unitId, unitIds)));

      const { coreResourceIds, activeExerciseIds } = await getCoreResourceAndActiveExerciseIds(allChunks);

      const { resourceCompletions, exerciseCompletions } = await getUserCompletions(
        coreResourceIds,
        activeExerciseIds,
        ctx.auth.email,
      );

      // Build Sets for faster lookup
      const coreResourceIdSet = new Set(coreResourceIds);
      const activeExerciseIdSet = new Set(activeExerciseIds);
      const completedResourceIdSet = new Set(
        resourceCompletions.map((c) => c.unitResourceId).filter((id): id is string => id != null),
      );
      const completedExerciseIdSet = new Set(exerciseCompletions.map((e) => e.exerciseId));

      const chunkProgressByUnitNumber: Record<string, ChunkProgress[]> = {};

      for (const unit of units) {
        const unitChunks = allChunks
          .filter((c) => c.unitId === unit.id)
          .sort((a, b) => Number(a.chunkOrder) - Number(b.chunkOrder));
        chunkProgressByUnitNumber[unit.unitNumber] = unitChunks.map((chunk) => {
          return calculateChunkProgress(
            chunk,
            coreResourceIdSet,
            activeExerciseIdSet,
            completedResourceIdSet,
            completedExerciseIdSet,
          );
        });
      }

      const courseTotalCount = coreResourceIds.length + activeExerciseIds.length;
      const courseCompletedCount = completedResourceIdSet.size + completedExerciseIdSet.size;
      const percentage = courseTotalCount > 0 ? Math.round((courseCompletedCount / courseTotalCount) * 100) : 0;

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
