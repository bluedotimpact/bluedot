import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  resourceCompletionTable, ResourceCompletion,
} from '@bluedot/db/';
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

export type GetResourceCompletionResponse = {
  type: 'success',
  resourceCompletion?: ResourceCompletion,
};

export type PutResourceCompletionRequest = {
  rating?: number | null,
  isCompleted?: boolean,
  feedback?: string,
  resourceFeedback?: typeof RESOURCE_FEEDBACK[keyof typeof RESOURCE_FEEDBACK],
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.optional(
    z.object({
      rating: z.number().optional(),
      isCompleted: z.boolean().optional(),
      feedback: z.string().optional(),
      resourceFeedback: z.union([
        z.literal(RESOURCE_FEEDBACK.DISLIKE),
        z.literal(RESOURCE_FEEDBACK.NO_RESPONSE),
        z.literal(RESOURCE_FEEDBACK.LIKE),
      ]).optional(),
    }),
  ),
  responseBody: z.object({
    type: z.literal('success'),
    resourceCompletion: z.any().optional(),
  }),
}, async (body, { raw, auth }) => {
  const { unitResourceId } = raw.req.query;

  if (typeof unitResourceId !== 'string') {
    throw new createHttpError.BadRequest('Invalid unit resource ID');
  }

  let resourceCompletion: ResourceCompletion | null;
  try {
    resourceCompletion = await db.getFirst(resourceCompletionTable, {
      filter: { unitResourceIdRead: unitResourceId, email: auth.email },
    });
  } catch (error) {
    throw new createHttpError.InternalServerError(
      process.env.NODE_ENV === 'production'
        ? 'Database error occurred'
        : `Database error occurred: ${error instanceof Error ? error.message : String(error)}`,
    );
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
          rating: body.rating ?? null,
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
