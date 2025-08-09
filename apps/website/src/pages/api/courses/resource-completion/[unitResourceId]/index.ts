import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  resourceCompletionTable, InferSelectModel,
} from '@bluedot/db/';
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type ResourceCompletion = InferSelectModel<typeof resourceCompletionTable.pg>;

export type GetResourceCompletionResponse = {
  type: 'success',
  resourceCompletion?: ResourceCompletion,
};

export type PutResourceCompletionRequest = {
  rating?: number | null,
  isCompleted?: boolean,
  feedback?: string,
  resourceFeedback?: number,
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.optional(
    z.object({
      rating: z.number().optional(),
      isCompleted: z.boolean().optional(),
      feedback: z.string().optional(),
      resourceFeedback: z.number().optional(),
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

  // Try to get existing resource completion
  let resourceCompletion: ResourceCompletion | null = null;
  try {
    resourceCompletion = await db.get(resourceCompletionTable, { unitResourceIdRead: unitResourceId, email: auth.email });
  } catch (error) {
    // Resource completion doesn't exist, which is fine for PUT requests
  }

  switch (raw.req.method) {
    // Get resource completion
    case 'GET': {
      if (!resourceCompletion) {
        throw new createHttpError.NotFound('Resource completion not found');
      }

      return {
        type: 'success' as const,
        resourceCompletion: {
          ...resourceCompletion,
          // For some reason Airtable often adds a newline to the end of the feedback
          feedback: resourceCompletion.feedback?.trimEnd(),
        },
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
          resourceFeedback: body.resourceFeedback ?? resourceCompletion.resourceFeedback,
        });
      } else {
        // If the resource completion does NOT exist, create it
        updatedResourceCompletion = await db.insert(resourceCompletionTable, {
          email: auth.email,
          unitResourceIdWrite: unitResourceId,
          rating: body.rating ?? RESOURCE_FEEDBACK.NO_RESPONSE,
          isCompleted: body.isCompleted ?? false,
          feedback: body.feedback ?? '',
          resourceFeedback: body.resourceFeedback ?? RESOURCE_FEEDBACK.NO_RESPONSE,
        });
      }

      return {
        type: 'success' as const,
        resourceCompletion: {
          ...updatedResourceCompletion,
          // For some reason Airtable often adds a newline to the end of the feedback
          feedback: updatedResourceCompletion.feedback?.trimEnd(),
        },
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
