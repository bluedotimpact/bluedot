import {
  and, desc, eq, inArray, resourceCompletionTable,
} from '@bluedot/db';
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';
import { z } from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const resourcesRouter = router({
  getResourceCompletions: protectedProcedure
    .input(z.object({ unitResourceIds: z.array(z.string().min(1)).max(100) }))
    .query(async ({ input, ctx }) => {
      const resourceCompletions = await db.pg
        .select()
        .from(resourceCompletionTable.pg)
        .where(and(
          inArray(resourceCompletionTable.pg.unitResourceId, input.unitResourceIds),
          eq(resourceCompletionTable.pg.email, ctx.auth.email),
        ))
        .orderBy(desc(resourceCompletionTable.pg.autoNumberId));

      // Deduplicate by unitResourceId, keeping only the first occurrence.
      // Although we should only have one resource completion for a resource per user, it is possible to have multiple
      // (e.g. if a user quickly submits multiple times before the first is saved). We cannot enforce uniqueness in
      // Airtable, so we handle it here.
      const seenIds = new Set<string>();
      const uniqueCompletions = resourceCompletions.filter((completion) => {
        if (!completion.unitResourceId) {
          return false;
        }

        if (seenIds.has(completion.unitResourceId)) {
          return false;
        }

        seenIds.add(completion.unitResourceId);
        return true;
      });

      return uniqueCompletions;
    }),

  saveResourceCompletion: protectedProcedure
    .input(z.object({
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
    }))
    .mutation(async ({ input, ctx }) => {
      const resourceCompletion = await db.getFirst(resourceCompletionTable, {
        filter: {
          unitResourceId: input.unitResourceId,
          email: ctx.auth.email,
        },
      });

      let updatedResourceCompletion;

      // Upsert logic
      if (resourceCompletion) {
        // Update existing resource completion
        updatedResourceCompletion = await db.update(resourceCompletionTable, {
          id: resourceCompletion.id,
          unitResourceId: input.unitResourceId,
          rating: input.rating ?? resourceCompletion.rating,
          isCompleted: input.isCompleted ?? resourceCompletion.isCompleted,
          feedback: input.feedback ?? resourceCompletion.feedback,
          resourceFeedback: input.resourceFeedback ?? resourceCompletion.resourceFeedback,
        });
      } else {
        // Create new resource completion
        updatedResourceCompletion = await db.insert(resourceCompletionTable, {
          email: ctx.auth.email,
          unitResourceId: input.unitResourceId,
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
