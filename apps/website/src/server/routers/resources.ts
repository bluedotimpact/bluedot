import {
  and, arrayContains, desc, eq, inArray, resourceCompletionPgTable, unitResourceTable,
} from '@bluedot/db';
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import { getUserOrThrow, protectedProcedure, router } from '../trpc';

export const resourcesRouter = router({
  getResourceCompletions: protectedProcedure
    .input(z.object({ unitResourceIds: z.array(z.string().min(1)).max(100) }))
    .query(async ({ input, ctx }) => {
      const user = await getUserOrThrow(ctx.auth.email);

      const resourceCompletions = await db.pg
        .select()
        .from(resourceCompletionPgTable.pg)
        .where(and(
          inArray(resourceCompletionPgTable.pg.unitResourceId, input.unitResourceIds),
          arrayContains(resourceCompletionPgTable.pg.userId, [user.id]),
        ))
        .orderBy(desc(resourceCompletionPgTable.pg.createdAt));

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
      const [unitResource, user] = await Promise.all([
        db.getFirst(unitResourceTable, { filter: { id: input.unitResourceId }, sortBy: 'id' }),
        getUserOrThrow(ctx.auth.email),
      ]);

      const [resourceCompletion] = await db.pg
        .select()
        .from(resourceCompletionPgTable.pg)
        .where(and(
          eq(resourceCompletionPgTable.pg.unitResourceId, input.unitResourceId),
          arrayContains(resourceCompletionPgTable.pg.userId, [user.id]),
        ))
        .orderBy(desc(resourceCompletionPgTable.pg.createdAt))
        .limit(1);

      let completedAt: string | null | undefined;
      if (input.isCompleted === true && resourceCompletion?.completedAt == null) {
        completedAt = new Date().toISOString();
      } else if (input.isCompleted === false) {
        completedAt = null;
      } // else undefined = "don't change"

      const [updatedResourceCompletion] = resourceCompletion
        ? await db.pg
          .update(resourceCompletionPgTable.pg)
          .set({
            completedAt: completedAt !== undefined ? completedAt : resourceCompletion.completedAt,
            feedback: input.feedback ?? resourceCompletion.feedback,
            resourceFeedback: input.resourceFeedback ?? resourceCompletion.resourceFeedback,
          })
          .where(eq(resourceCompletionPgTable.pg.id, resourceCompletion.id))
          .returning()
        : await db.pg
          .insert(resourceCompletionPgTable.pg)
          .values({
            email: ctx.auth.email,
            unitResourceId: input.unitResourceId,
            completedAt: completedAt ?? null,
            feedback: input.feedback ?? '',
            resourceFeedback: input.resourceFeedback ?? RESOURCE_FEEDBACK.NO_RESPONSE,
            resourceId: unitResource?.resourceId ?? null,
            userId: [user.id],
            createdAt: new Date().toISOString(),
          })
          .returning();

      if (!updatedResourceCompletion) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save resource completion' });

      return {
        ...updatedResourceCompletion,
        feedback: updatedResourceCompletion.feedback?.trimEnd(),
      };
    }),
});
