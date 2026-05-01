import { courseRegistrationTable, dropoutTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const dropoutRouter = router({
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

      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          id: applicantId,
          email: ctx.auth.email,
        },
      });
      if (!courseRegistration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course registration not found' });
      }

      const oldRoundId = courseRegistration.roundId ?? null;

      return db.insert(dropoutTable, {
        applicantId: [applicantId],
        reason: reason ?? null,
        type,
        newRoundId: type === 'Deferral' && newRoundId ? [newRoundId] : null,
        oldRoundId: type === 'Deferral' && oldRoundId ? [oldRoundId] : null,
      });
    }),
});
