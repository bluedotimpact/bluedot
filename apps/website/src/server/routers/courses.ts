import { courseTable, unitTable } from '@bluedot/db';
import z from 'zod';
import db from '../../lib/api/db';
import { unitFilterActiveChunks } from '../../lib/api/utils';
import { publicProcedure, router } from '../trpc';

/**
 * Fetches course data and its associated units by course slug.
 * This function is shared between the tRPC procedure below and getStaticProps/getServerSideProps when needed.
 */
export async function getCourseData(courseSlug: string) {
  const course = await db.get(courseTable, { slug: courseSlug });

  // Get units for this course with active status, then sort by unit number
  const allUnitsWithAllChunks = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });
  const allUnits = await unitFilterActiveChunks({ units: allUnitsWithAllChunks, db });
  const units = allUnits.sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''));

  return {
    course,
    units,
  };
}

export const coursesRouter = router({
  getBySlug: publicProcedure
    .input(
      z.object({
        courseSlug: z.string(),
      }),
    )
    .query(async ({ input: { courseSlug } }) => {
      return getCourseData(courseSlug);
    }),
});
