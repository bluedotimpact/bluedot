import z from 'zod';
import { publicProcedure, router } from '../trpc';

export const feedbackRouter = router({
  submitBugReport: publicProcedure
    .input(
      z.object({
        description: z.string().min(1).max(5000),
        email: z.string().email().optional(),
        recordingUrl: z.string().url().optional(),
        attachments: z
          .array(
            z.object({
              base64: z.string(),
              filename: z.string(),
              mimeType: z.string(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ input }) => {
      // TODO: (1) insert everything except attachments into airtable, (2) upload attachments using airtable API
      return null;
    }),
});
