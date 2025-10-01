import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  courseTable,
  unitTable,
  Course,
  Unit,
} from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { unitFilterActiveChunks } from '../../../../lib/api/utils';

export type CourseAndUnits = {
  course: Course,
  units: Unit[],
};

export type GetCourseResponse = {
  type: 'success',
} & CourseAndUnits;

/**
 * Fetches course data and its associated units by course slug.
 * This function is shared between the API route below and getStaticProps/getServerSideProps when needed.
 */
export async function getCourseData(courseSlug: string): Promise<CourseAndUnits> {
  const course = await db.get(courseTable, { slug: courseSlug });

  if (!course) {
    throw new createHttpError.NotFound(`Course not found: ${courseSlug}`);
  }

  // Get units for this course with active status, then sort by unit number
  const allUnitsWithAllChunks = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });
  const allUnits = await unitFilterActiveChunks({ units: allUnitsWithAllChunks, db });
  const units = allUnits.sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''));

  return {
    course,
    units,
  };
}

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    course: z.any(),
    units: z.array(z.any()),
  }),
}, async (body, { raw }) => {
  const { courseSlug } = raw.req.query;
  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }

  const { course, units } = await getCourseData(courseSlug);

  return {
    type: 'success' as const,
    course,
    units,
  };
});
