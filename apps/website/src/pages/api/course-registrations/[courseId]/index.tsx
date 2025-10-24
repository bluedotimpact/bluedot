import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  applicationsCourseTable, courseRegistrationTable, CourseRegistration,
} from '@bluedot/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import db from '../../../../lib/api/db';
import { FOAI_COURSE_ID } from '../../../../lib/constants';

export type GetCourseRegistrationResponse = {
  type: 'success';
  courseRegistration: CourseRegistration | null;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    source: z.string().trim().max(255).nullish(),
  }).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    courseRegistration: z.any().nullable(),
  }),
}, async (body, { auth, raw }) => {
  switch (raw.req.method) {
    case 'GET':
    case 'POST': {
      const { courseId } = raw.req.query;
      if (typeof courseId !== 'string' || !courseId) {
        throw new createHttpError.BadRequest('Invalid courseId parameter');
      }

      const source = body?.source;

      let courseRegistration: CourseRegistration | null;
      try {
        courseRegistration = await db.getFirst(courseRegistrationTable, {
          filter: {
            email: auth.email,
            courseId,
            decision: 'Accept',
          },
        });
      } catch (error) {
        throw new createHttpError.InternalServerError(
          process.env.NODE_ENV === 'production'
            ? 'Database error occurred'
            : `Database error occurred: ${error instanceof Error ? error.message : String(error)}`,
        );
      }

      if (courseRegistration) {
        return {
          type: 'success' as const,
          courseRegistration,
        };
      }

      // Get-or-create if this is the future-of-ai course. Users are allowed to complete the course independently
      if (courseId === FOAI_COURSE_ID) {
        const applicationsCourse = await db.getFirst(applicationsCourseTable, {
          sortBy: 'id',
          filter: { courseBuilderId: courseId },
        });

        if (!applicationsCourse) {
          throw new createHttpError.InternalServerError(`Course configuration not found for course: ${courseId}`);
        }

        const newCourseRegistration = await db.insert(courseRegistrationTable, {
          email: auth.email,
          courseApplicationsBaseId: applicationsCourse.id,
          role: 'Participant',
          decision: 'Accept',
          source: source ?? null,
        });

        return {
          type: 'success' as const,
          courseRegistration: newCourseRegistration,
        };
      }

      return {
        type: 'success' as const,
        courseRegistration: null,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
