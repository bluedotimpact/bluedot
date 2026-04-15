import { z } from 'zod';
import { protectedProcedure, router } from '../trpc';

export const facilitatorFeedbackRouter = router({
  getFormData: protectedProcedure
    .input(z.object({
      groupId: z.string().min(1),
    }))
    .query(async ({ input }) => {
      // TODO: fetch group, verify facilitator, get participants
      return {
        groupId: input.groupId,
      };
    }),
});
