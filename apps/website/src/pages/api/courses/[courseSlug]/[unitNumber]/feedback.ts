import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  unitFeedbackTable, UnitFeedback,
  unitTable,
} from '@bluedot/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import db from '../../../../../lib/api/db';

export type GetUnitFeedbackResponse = {
  type: 'success';
  unitFeedback: UnitFeedback;
};

export type PutUnitFeedbackRequest = Pick<UnitFeedback, 'overallRating' | 'anythingElse'>;
export type PutUnitFeedbackResponse = {
  type: 'success';
  unitFeedback: UnitFeedback;
};

export default makeApiRoute(
  {
    requireAuth: true,
    requestBody: z.optional(
      z.object({
        overallRating: z.number().min(1).max(5),
        anythingElse: z.string(),
      }),
    ),
    responseBody: z.object({
      type: z.literal('success'),
      unitFeedback: z.any(),
    }),
  },
  async (body, { raw, auth }) => {
    const { courseSlug, unitNumber } = raw.req.query;

    if (!auth.email || typeof courseSlug !== 'string' || typeof unitNumber !== 'string') {
      throw new createHttpError.BadRequest();
    }

    const { method } = raw.req;
    if (method !== 'GET' && method !== 'PUT') {
      throw createHttpError.MethodNotAllowed();
    }

    const unit = await db.get(unitTable, { courseSlug, unitNumber });

    let existingFeedback: UnitFeedback | null;
    try {
      existingFeedback = await db.getFirst(unitFeedbackTable, {
        filter: { unitId: unit.id, userEmail: auth.email },
      });
    } catch (error) {
      throw new createHttpError.InternalServerError('Database error occurred');
    }

    if (method === 'GET') {
      return {
        type: 'success' as const,
        unitFeedback: existingFeedback,
      };
    }

    if (method === 'PUT') {
      if (!body) {
        throw new createHttpError.BadRequest('PUT requests require a body');
      }

      const { overallRating, anythingElse } = body;

      let upsertedFeedback: UnitFeedback | null = null;

      // If the feedback does exist, update it
      if (existingFeedback) {
        upsertedFeedback = await db.update(unitFeedbackTable, {
          id: existingFeedback.id,
          lastModified: new Date().toISOString(),
          overallRating,
          anythingElse,
        });
      } else {
        // If the feedback does NOT exist, create it
        upsertedFeedback = await db.insert(unitFeedbackTable, {
          unitId: unit.id,
          createdAt: new Date().toISOString(),
          lastModified: new Date().toISOString(),
          userEmail: auth.email,
          overallRating,
          anythingElse,
        });
      }

      return {
        type: 'success' as const,
        unitFeedback: upsertedFeedback,
      };
    }

    // We should never get here, but just in case
    throw new createHttpError.MethodNotAllowed();
  },
);
