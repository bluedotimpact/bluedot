import {
  and, courseBuilderUserTable, desc, eq, getFirstFromPg, inArray, resourceCompletionPgTable, unitResourceTable,
} from '@bluedot/db';
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const resourcesRouter = router({
  getResourceCompletions: protectedProcedure
    .input(z.object({ unitResourceIds: z.array(z.string().min(1)).max(100) }))
    .query(async ({ input, ctx }) => {
      const resourceCompletions = await db.pg
        .select()
        .from(resourceCompletionPgTable)
        .where(and(
          inArray(resourceCompletionPgTable.unitResourceId, input.unitResourceIds),
          eq(resourceCompletionPgTable.email, ctx.auth.email),
        ))
        .orderBy(desc(resourceCompletionPgTable.createdAt));

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
      let completedAt: string | null | undefined;
      if (input.isCompleted === true) {
        completedAt = new Date().toISOString();
      } else if (input.isCompleted === false) {
        completedAt = null;
      }

      const [resourceCompletion, unitResource, cbUser] = await Promise.all([
        getFirstFromPg(db.pg, resourceCompletionPgTable, {
          filter: {
            unitResourceId: input.unitResourceId,
            email: ctx.auth.email,
          },
          sortBy: { field: 'createdAt', direction: 'desc' },
        }),
        db.getFirst(unitResourceTable, { filter: { id: input.unitResourceId }, sortBy: 'id' }),
        db.getFirst(courseBuilderUserTable, { filter: { email: ctx.auth.email }, sortBy: 'email' }),
      ]);

      const [updatedResourceCompletion] = resourceCompletion
        ? await db.pg
          .update(resourceCompletionPgTable)
          .set({
            isCompleted: input.isCompleted ?? resourceCompletion.isCompleted,
            feedback: input.feedback ?? resourceCompletion.feedback,
            resourceFeedback: input.resourceFeedback ?? resourceCompletion.resourceFeedback,
            completedAt: completedAt !== undefined ? completedAt : resourceCompletion.completedAt,
          })
          .where(eq(resourceCompletionPgTable.id, resourceCompletion.id))
          .returning()
        : await db.pg
          .insert(resourceCompletionPgTable)
          .values({
            email: ctx.auth.email,
            unitResourceId: input.unitResourceId,
            isCompleted: input.isCompleted ?? false,
            feedback: input.feedback ?? '',
            resourceFeedback: input.resourceFeedback ?? RESOURCE_FEEDBACK.NO_RESPONSE,
            resourceId: unitResource?.resourceId ?? null,
            createdByUserId: cbUser ? [cbUser.id] : null,
            createdAt: new Date().toISOString(),
            completedAt: completedAt ?? null,
          })
          .returning();

      if (!updatedResourceCompletion) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save resource completion' });

      return {
        ...updatedResourceCompletion,
        feedback: updatedResourceCompletion.feedback?.trimEnd(),
      };
    }),
});
