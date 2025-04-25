import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import db from '../../../../lib/api/db';
import {
  applicationsCourseTable,
  CourseRegistration,
  courseRegistrationTable,
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
  }),
}, async (body, { auth, raw }) => {
  switch (raw.req.method) {
    case 'GET': {
      const { courseId } = raw.req.query;
      if (typeof courseId !== 'string' || !courseId) {
        throw new createHttpError.BadRequest('Invalid courseId parameter');
      }

      const courseRegistration = (await db.scan(courseRegistrationTable, {
        filterByFormula: `AND({Email} = "${auth.email}", {[>] Course ID} = "${courseId}", {Decision} = "Accept")`,
      }))[0];
      if (courseRegistration) {
        return {
          type: 'success' as const,
          courseRegistration,
        };
      }

      const courseApplicationsBaseId = (await db.scan(applicationsCourseTable))
        .find((c) => c.courseBuilderId === raw.req.query.courseId)
        ?.id;
      if (!courseApplicationsBaseId) {
        throw new createHttpError.NotFound('Course not found');
      }

      const newCourseRegistration = await db.insert(courseRegistrationTable, {
        email: auth.email,
        courseApplicationsBaseId,
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
