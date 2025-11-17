import { resourceCompletionTable } from '@bluedot/db';
import { RESOURCE_FEEDBACK, type ResourceCompletion } from '@bluedot/db/src/schema';
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

      return resourceCompletion ? {
        ...resourceCompletion,
        // Trim feedback field (Airtable quirk)
        feedback: resourceCompletion.feedback?.trimEnd(),
      } : null;
    }),

  saveResourceCompletion: protectedProcedure
    .input(
      z.object({
        unitResourceId: z.string().min(1),
        rating: z.number().nullable().optional(),
        isCompleted: z.boolean().optional(),
        feedback: z.string().optional(),
        resourceFeedback: z
          .union([
            z.literal(RESOURCE_FEEDBACK.DISLIKE),
            z.literal(RESOURCE_FEEDBACK.NO_RESPONSE),
            z.literal(RESOURCE_FEEDBACK.LIKE),
          ])
          .optional(),
      }),
    )
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
          rating: input.rating ?? resourceCompletion.rating,
          isCompleted: input.isCompleted ?? resourceCompletion.isCompleted,
          feedback: input.feedback ?? resourceCompletion.feedback,
          resourceFeedback: input.resourceFeedback ?? resourceCompletion.resourceFeedback,
        });
      } else {
        // Create new resource completion
        updatedResourceCompletion = await db.insert(resourceCompletionTable, {
          email: ctx.auth.email,
          unitResourceIdWrite: input.unitResourceId,
          rating: input.rating ?? null,
          isCompleted: input.isCompleted ?? false,
          feedback: input.feedback ?? '',
          resourceFeedback: input.resourceFeedback ?? RESOURCE_FEEDBACK.NO_RESPONSE,
        });
      }

      // Trim feedback field (Airtable quirk) and return
      return {
        ...updatedResourceCompletion,
        feedback: updatedResourceCompletion.feedback?.trimEnd(),
      };
    }),
});
