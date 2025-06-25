import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  courseTable, unitTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

type Course = InferSelectModel<typeof courseTable.pg>;
type Unit = InferSelectModel<typeof unitTable.pg>;

export type GetCourseResponse = {
  type: 'success',
  course: Course,
  units: Unit[],
};

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

  const course = await db.get(courseTable, { slug: courseSlug });

  // Get units for this course with active status, then sort by unit number
  const allUnits = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });
  const units = allUnits.sort((a, b) => (a.unitNumber || '').localeCompare(b.unitNumber || ''));

  return {
    type: 'success' as const,
    course,
    units,
  };
});
