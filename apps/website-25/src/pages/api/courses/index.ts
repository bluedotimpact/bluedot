import { z } from 'zod';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { Course, courseTable } from '../../../lib/api/db/tables';

export type GetCoursesResponse = {
  type: 'success',
  courses: Course[],
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    courses: z.array(z.any()),
  }),
}, async () => {
  const allCourses = await db.scan(courseTable);
  const courseHubCourses = allCourses.filter((c) => c.displayOnCourseHubIndex);

  return {
    type: 'success' as const,
    courses: courseHubCourses,
  };
});
