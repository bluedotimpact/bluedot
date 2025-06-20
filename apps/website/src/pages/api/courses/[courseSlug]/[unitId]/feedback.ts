import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, unitFeedbackTable, InferSelectModel,
} from '@bluedot/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import db from '../../../../../lib/api/db';

type UnitFeedback = InferSelectModel<typeof unitFeedbackTable.pg>;

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
    const { unitId } = raw.req.query;

    if (!auth.email || typeof unitId !== 'string') {
      throw new createHttpError.BadRequest();
    }

    const { method } = raw.req;
    if (method !== 'GET' && method !== 'PUT') {
      createHttpError.MethodNotAllowed();
    }

    const existingFeedbacks = await db.pg.select()
      .from(unitFeedbackTable.pg)
      .where(and(
        eq(unitFeedbackTable.pg.unitId, unitId),
        eq(unitFeedbackTable.pg.userEmail, auth.email),
      ));

    const existingFeedback = existingFeedbacks[0];

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
        upsertedFeedback = await db.airtableUpdate(unitFeedbackTable, {
          id: existingFeedback.id || '',
          lastModified: new Date().toISOString(),
          overallRating,
          anythingElse,
        });
      } else {
        // If the feedback does NOT exist, create it
        upsertedFeedback = await db.airtableInsert(unitFeedbackTable, {
          unitId,
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
