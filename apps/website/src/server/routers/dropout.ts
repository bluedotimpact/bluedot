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
      isDeferral: z.boolean(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { applicantId, reason, isDeferral } = input;

      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          id: applicantId,
          email: ctx.auth.email,
        },
      });
      if (!courseRegistration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course registration not found' });
      }

      return db.insert(dropoutTable, {
        applicantId: [applicantId],
        reason: reason ?? null,
        isDeferral,
      });
    }),
});
