import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula } from 'airtable-ts-formula';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import {
  ResourceCompletion,
  resourceCompletionTable,
} from '../../../../../lib/api/db/tables';

export type GetResourceCompletionResponse = {
  type: 'success',
  resourceCompletion?: ResourceCompletion,
};

export type PutResourceCompletionRequest = {
  rating?: number,
  isCompleted?: boolean,
  feedback?: string,
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.optional(
    z.object({
      rating: z.number().optional(),
      isCompleted: z.boolean().optional(),
      feedback: z.string().optional(),
    }),
  ),
  responseBody: z.object({
    type: z.literal('success'),
    resourceCompletion: z.any().optional(),
  }),
}, async (body, { raw, auth }) => {
  const { unitResourceId } = raw.req.query;

  if (!auth.email || typeof unitResourceId !== 'string') {
    throw new createHttpError.BadRequest();
  }

  const resourceCompletion = (await db.scan(resourceCompletionTable, {
    filterByFormula: formula(await db.table(resourceCompletionTable), [
      'AND',
      ['=', { field: 'unitResourceIdRead' }, unitResourceId],
      ['=', { field: 'email' }, auth.email],
    ]),
  }))[0];

  switch (raw.req.method) {
    // Get resource completion
    case 'GET': {
      return {
        type: 'success' as const,
        resourceCompletion,
      };
    }

    // Upsert resource completion
    case 'PUT': {
      if (!body) {
        throw new createHttpError.BadRequest('PUT requests require a body');
      }

      let updatedResourceCompletion;

      // If the resource completion does exist, update it
      if (resourceCompletion) {
        updatedResourceCompletion = await db.update(resourceCompletionTable, {
          id: resourceCompletion.id,
          unitResourceIdWrite: unitResourceId,
          rating: body.rating ?? resourceCompletion.rating,
          isCompleted: body.isCompleted ?? resourceCompletion.isCompleted,
          feedback: body.feedback ?? resourceCompletion.feedback,
        });
      } else {
        // If the resource completion does NOT exist, create it
        updatedResourceCompletion = await db.insert(resourceCompletionTable, {
          email: auth.email,
          unitResourceIdWrite: unitResourceId,
          rating: body.rating ?? 0,
          isCompleted: body.isCompleted ?? false,
          feedback: body.feedback ?? '',
        });
      }

      return {
        type: 'success' as const,
        resourceCompletion: updatedResourceCompletion,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
