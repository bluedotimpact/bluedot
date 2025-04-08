import { z } from 'zod';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import {
  Course,
  courseTable,
  Unit,
  unitTable,
} from '../../../../lib/api/db/tables';

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
  const { courseId } = raw.req.query;

  const course = (await db.scan(courseTable, {
    filterByFormula: `{Record ID} = "${courseId}"`,
  }))[0];

  const units = (await db.scan(unitTable, {
    filterByFormula: `{Course Record ID} = "${courseId}"`,
  })).sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  return {
    type: 'success' as const,
    course,
    units,
  };
});
