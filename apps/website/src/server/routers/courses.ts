import {
  and,
  chunkTable,
  courseTable,
  eq,
  exerciseTable,
  inArray,
  unitTable,
} from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { removeInactiveChunkIdsFromUnits } from '../../lib/api/utils';
import { publicProcedure, router } from '../trpc';

export type CourseAndUnits = inferRouterOutputs<typeof coursesRouter>['getBySlug'];
export type CurriculumMetadata = inferRouterOutputs<typeof coursesRouter>['getCurriculumMetadata'];

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
      const course = await db.get(courseTable, { slug: courseSlug }).catch(() => null);
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
});
