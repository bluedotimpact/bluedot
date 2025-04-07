import { z } from 'zod';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { Course, courseTable } from '../../../lib/api/db/tables';

export type GetCourseResponse = {
  type: 'success',
  course: Course,
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    course: z.any(),
  }),
}, async (body, { raw }) => {
  const { courseId } = raw.req.query;
  const course = (await db.scan(courseTable, {
    // Option A:
    // http://localhost:8000/courses/What%20the%20fish%20[Test%20Course]
    // filterByFormula: `{Course} = "${courseId}"`,

    // Option B:
    // http://localhost:8000/courses/rec8CeVOWU0mGu2Jf
    filterByFormula: `{Record ID} = "${courseId}"`,
  }))[0];

  return {
    type: 'success' as const,
    course,
  };
});
