import { dropoutTable } from '@bluedot/db';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const dropoutRouter = router({
  dropoutOrDeferral: protectedProcedure
    .input(
      z.object({
        applicantId: z.array(z.string().min(1)).min(1),
        reason: z.string(),
        isDeferral: z.boolean(),
      }),
    )
    .mutation(async ({ input }) => {
      const { applicantId, reason, isDeferral } = input;

      return db.insert(dropoutTable, {
        applicantId,
        reason,
        isDeferral,
      });
    }),
});
