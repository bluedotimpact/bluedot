import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  applicationsCourseTable, courseRegistrationTable, InferSelectModel,
} from '@bluedot/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import db from '../../../../lib/api/db';

type CourseRegistration = InferSelectModel<typeof courseRegistrationTable.pg>;

export type GetCourseRegistrationResponse = {
  type: 'success';
  courseRegistration: CourseRegistration;
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    courseRegistration: z.any(),
  }),
}, async (body, { auth, raw }) => {
  switch (raw.req.method) {
    case 'GET': {
      const { courseId } = raw.req.query;
      if (typeof courseId !== 'string' || !courseId) {
        throw new createHttpError.BadRequest('Invalid courseId parameter');
      }

      // Try to get existing course registration
      let courseRegistration: CourseRegistration | null = null;
      try {
        courseRegistration = await db.get(courseRegistrationTable, {
          email: auth.email,
          courseId,
          decision: 'Accept',
        });
      } catch (error) {
        // Course registration doesn't exist, we'll create one
      }

      if (courseRegistration) {
        return {
          type: 'success' as const,
          courseRegistration,
        };
      }

      const applicationsCourse = await db.get(applicationsCourseTable, { courseBuilderId: courseId });

      const newCourseRegistration = await db.insert(courseRegistrationTable, {
        email: auth.email,
        courseApplicationsBaseId: applicationsCourse.id,
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
