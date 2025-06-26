import { z } from 'zod';
import createHttpError from 'http-errors';
import { courseRegistrationTable } from '@bluedot/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import db from '../../../../lib/api/db';

export type PutProgressRequest = {
  lastVisitedUnitNumber: number;
  lastVisitedChunkIndex: number;
};

export type PutProgressResponse = {
  type: 'success';
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    lastVisitedUnitNumber: z.number(),
    lastVisitedChunkIndex: z.number(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
  }),
}, async (body, { auth, raw }) => {
  const { courseId } = raw.req.query;

  if (!auth.email || typeof courseId !== 'string') {
    throw new createHttpError.BadRequest();
  }

  // Get existing registration
  let registration;
  try {
    registration = await db.get(courseRegistrationTable, {
      email: auth.email,
      courseId,
      decision: 'Accept',
    });
  } catch (error) {
    throw new createHttpError.NotFound('Course registration not found');
  }

  // Update progress
  await db.update(courseRegistrationTable, {
    id: registration.id,
    lastVisitedUnitNumber: body.lastVisitedUnitNumber,
    lastVisitedChunkIndex: body.lastVisitedChunkIndex,
  });

  return { type: 'success' as const };
});
