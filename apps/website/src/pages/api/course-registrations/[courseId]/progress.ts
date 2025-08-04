import { z } from 'zod';
import createHttpError from 'http-errors';
import { courseRegistrationTable } from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    lastVisitedUnitNumber: z.number(),
    lastVisitedChunkIndex: z.number(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
    courseRegistration: z.any(),
  }),
}, async (body, { auth, raw }) => {
  switch (raw.req.method) {
    case 'PUT': {
      const { courseId } = raw.req.query;
      if (typeof courseId !== 'string' || !courseId) {
        throw new createHttpError.BadRequest('Invalid courseId parameter');
      }

      if (!body) {
        throw new createHttpError.BadRequest('PUT requests require a body');
      }

      // Get existing course registration
      const courseRegistration = await db.get(courseRegistrationTable, {
        email: auth.email,
        courseId,
        decision: 'Accept',
      });

      // Update progress
      const updatedCourseRegistration = await db.update(courseRegistrationTable, {
        id: courseRegistration.id,
        lastVisitedUnitNumber: body.lastVisitedUnitNumber,
        lastVisitedChunkIndex: body.lastVisitedChunkIndex,
      });

      return {
        type: 'success' as const,
        courseRegistration: updatedCourseRegistration,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
