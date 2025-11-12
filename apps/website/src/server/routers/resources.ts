import { resourceCompletionTable } from '@bluedot/db';
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const resourcesRouter = router({
  getResourceCompletion: protectedProcedure
    .input(z.object({ unitResourceId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const resourceCompletion = await db.getFirst(resourceCompletionTable, {
        filter: {
          unitResourceIdRead: input.unitResourceId,
          email: ctx.auth.email,
        },
      });

      // db.getFirst returns null when no record is found (not an error for this use case)
      if (!resourceCompletion) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Resource completion not found',
        });
      }

      // Trim feedback field (Airtable quirk)
      return {
        ...resourceCompletion,
        feedback: resourceCompletion.feedback?.trimEnd(),
      };
    }),

  saveResourceCompletion: protectedProcedure
    .input(z.object({
      unitResourceId: z.string().min(1),
      rating: z.number().nullable().optional(),
      isCompleted: z.boolean().optional(),
      feedback: z.string().optional(),
      resourceFeedback: z.union([
        z.literal(RESOURCE_FEEDBACK.DISLIKE),
        z.literal(RESOURCE_FEEDBACK.NO_RESPONSE),
        z.literal(RESOURCE_FEEDBACK.LIKE),
      ]).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const resourceCompletion = await db.getFirst(resourceCompletionTable, {
        filter: {
          unitResourceIdRead: input.unitResourceId,
          email: ctx.auth.email,
        },
      });

      let updatedResourceCompletion;

      // Upsert logic
      if (resourceCompletion) {
        // Update existing resource completion
        updatedResourceCompletion = await db.update(resourceCompletionTable, {
          id: resourceCompletion.id,
          unitResourceIdWrite: input.unitResourceId,
          rating: input.rating !== undefined ? input.rating : resourceCompletion.rating,
          isCompleted: input.isCompleted !== undefined ? input.isCompleted : resourceCompletion.isCompleted,
          feedback: input.feedback !== undefined ? input.feedback : resourceCompletion.feedback,
          resourceFeedback: input.resourceFeedback !== undefined ? input.resourceFeedback : resourceCompletion.resourceFeedback,
        });
      } else {
        // Create new resource completion
        updatedResourceCompletion = await db.insert(resourceCompletionTable, {
          email: ctx.auth.email,
          unitResourceIdWrite: input.unitResourceId,
          rating: input.rating !== undefined ? input.rating : null,
          isCompleted: input.isCompleted !== undefined ? input.isCompleted : false,
          feedback: input.feedback !== undefined ? input.feedback : '',
          resourceFeedback: input.resourceFeedback !== undefined ? input.resourceFeedback : RESOURCE_FEEDBACK.NO_RESPONSE,
        });
      }

      // Trim feedback field (Airtable quirk) and return
      return {
        ...updatedResourceCompletion,
        feedback: updatedResourceCompletion.feedback?.trimEnd(),
      };
    }),
});
