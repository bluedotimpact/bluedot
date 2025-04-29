import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula } from 'airtable-ts-formula';
import {
  UnitFeedback,
  unitFeedbackTable,
} from '../../../../../lib/api/db/tables';
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
    const { unitId } = raw.req.query;

    if (!auth.email || typeof unitId !== 'string') {
      throw new createHttpError.BadRequest();
    }

    const { method } = raw.req;
    if (method !== 'GET' && method !== 'PUT') {
      createHttpError.MethodNotAllowed();
    }

    const existingFeedback = (
      await db.scan(unitFeedbackTable, {
        // Note: Requires adding a Lookup field called "[>] Unit ID", that gets "[*] RecordID" from the Unit table
        filterByFormula: formula(await db.table(unitFeedbackTable), [
          'AND',
          ['=', { field: 'unitId' }, unitId],
          ['=', { field: 'userEmail' }, auth.email],
        ]),
      })
    )[0];

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
