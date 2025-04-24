import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import db from '../../../../lib/api/db';
import {
  CourseRegistration,
  courseRegistrationTable,
  courseTable,
} from '../../../../lib/api/db/tables';

export type GetCourseRegistrationResponse = {
  type: 'success';
  courseRegistration: CourseRegistration;
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    courseRegistration: z.any(),
  }).optional(),
}, async (body, { auth, raw }) => {
  switch (raw.req.method) {
    case 'GET': {
      const course = (await db.scan(courseTable, {
        filterByFormula: `{Course slug} = "${raw.req.query.courseSlug}"`,
      }))[0];
      if (!course) {
        throw new createHttpError.NotFound('Course not found');
      }

      const courseRegistration = (await db.scan(courseRegistrationTable, {
        filterByFormula: `AND({Email} = "${auth.email}", {[>] Course} = "${course.id}")`,
      }))[0];
      if (courseRegistration) {
        return {
          type: 'success' as const,
          courseRegistration,
        };
      }

      const newCourseRegistration = await db.insert(courseRegistrationTable, {
        email: auth.email,
        courseId: course.id,
        role: 'Participant',
        decision: 'Accept',
      });

      return {
        type: 'success' as const,
        courseRegistration: newCourseRegistration,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
