import {
  arrayOverlaps, COURSE_ROLE, courseRegistrationTable, dropoutTable, eq,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { getUserOrThrow, protectedProcedure, router } from '../trpc';

export const dropoutRouter = router({
  getStatusForUser: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserOrThrow(ctx.auth.sub);

    const regs = await db.pg
      .select({ id: courseRegistrationTable.pg.id })
      .from(courseRegistrationTable.pg)
      .where(eq(courseRegistrationTable.pg.userId, user.id));
    const regIds = regs.map((r) => r.id);
    if (regIds.length === 0) {
      return {};
    }

    const dropouts = await db.pg
      .select({ applicantId: dropoutTable.pg.applicantId, type: dropoutTable.pg.type })
      .from(dropoutTable.pg)
      .where(arrayOverlaps(dropoutTable.pg.applicantId, regIds));

    const result: Record<string, { isDroppedOut: boolean; isDeferred: boolean }> = {};
    for (const dropout of dropouts) {
      for (const regId of dropout.applicantId ?? []) {
        if (!regIds.includes(regId)) continue;
        const existing = result[regId] ?? { isDroppedOut: false, isDeferred: false };
        if (dropout.type === 'Deferral') {
          existing.isDeferred = true;
          existing.isDroppedOut = false;
        } else if (!existing.isDeferred) {
          existing.isDroppedOut = true;
        }

        result[regId] = existing;
      }
    }

    return result;
  }),

  dropoutOrDeferral: protectedProcedure
    .input(z.object({
      applicantId: z.string().min(1),
      reason: z.string().optional(),
      type: z.enum(['Drop out', 'Deferral']),
      newRoundId: z.string().optional(),
    }).refine((data) => data.type !== 'Deferral' || !!data.newRoundId, {
      message: 'newRoundId is required for deferrals',
      path: ['newRoundId'],
    }))
    .mutation(async ({ ctx, input }) => {
      const {
        applicantId, reason, type, newRoundId,
      } = input;

      const user = await getUserOrThrow(ctx.auth.sub);

      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          id: applicantId,
          userId: user.id,
        },
      });
      if (!courseRegistration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course registration not found' });
      }

      if (type === 'Deferral' && courseRegistration.decision === null) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Deferral is only available once an application decision has been made.' });
      }

      if (courseRegistration.role === COURSE_ROLE.FACILITATOR) {
        if (type === 'Deferral') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitators cannot defer a course.' });
        }

        if (courseRegistration.decision !== null) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitators can only withdraw an application that is still pending.' });
        }
      }

      const oldRoundId = courseRegistration.roundId ?? null;

      const dropout = await db.insert(dropoutTable, {
        applicantId: [applicantId],
        reason: reason ?? null,
        type,
        newRoundId: type === 'Deferral' && newRoundId ? [newRoundId] : null,
        oldRoundId: type === 'Deferral' && oldRoundId ? [oldRoundId] : null,
      });

      // A pre-decision application moves to "Withdrawn" so it's no longer evaluated (and potentially accepted) in review.
      if (type === 'Drop out' && courseRegistration.decision === null) {
        await db.update(courseRegistrationTable, { id: applicantId, decision: 'Withdrawn' });
      }

      return dropout;
    }),
});
