import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, asc, courseTable, unitTable, InferSelectModel,
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

  const courses = await db.pg.select()
    .from(courseTable.pg)
    .where(eq(courseTable.pg.slug, courseSlug));

  const course = courses[0];
  if (!course) {
    throw new createHttpError.NotFound('Course not found');
  }

  const units = await db.pg.select()
    .from(unitTable.pg)
    .where(and(
      eq(unitTable.pg.courseSlug, courseSlug),
      eq(unitTable.pg.unitStatus, 'Active'),
    ))
    .orderBy(asc(unitTable.pg.unitNumber));

  return {
    type: 'success' as const,
    course,
    units,
  };
});
