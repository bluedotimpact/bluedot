import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, applicationsCourseTable, courseRegistrationTable, InferSelectModel,
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

      const courseRegistrations = await db.pg.select()
        .from(courseRegistrationTable.pg)
        .where(and(
          eq(courseRegistrationTable.pg.email, auth.email),
          eq(courseRegistrationTable.pg.courseId, courseId),
          eq(courseRegistrationTable.pg.decision, 'Accept'),
        ));

      const courseRegistration = courseRegistrations[0];
      if (courseRegistration) {
        return {
          type: 'success' as const,
          courseRegistration,
        };
      }

      const applicationsCourses = await db.pg.select()
        .from(applicationsCourseTable.pg)
        .where(eq(applicationsCourseTable.pg.courseBuilderId, courseId));

      const courseApplicationsBaseId = applicationsCourses[0]?.id;
      if (!courseApplicationsBaseId) {
        throw new createHttpError.NotFound('Course not found');
      }

      const newCourseRegistration = await db.airtableInsert(courseRegistrationTable, {
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
