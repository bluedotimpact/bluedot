import { z } from 'zod';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { router, publicProcedure } from '../trpc';
import env from '../../lib/api/env';

// limits match the truncation in reportClientError.ts. real errors never hit these.
// they exist to reject oversized payloads from direct endpoint abuse.
const ClientErrorInput = z.object({
  message: z.string().max(1000),
  stack: z.string().max(5000).optional(),
  componentStack: z.string().max(5000).optional(),
  pageUrl: z.string().max(2000),
  userAgent: z.string().max(500),
  timestamp: z.string().max(100),
  source: z.enum(['window.onerror', 'unhandledrejection', 'errorboundary', 'error-page']),
});

export const errorsRouter = router({
  reportClientError: publicProcedure
    .input(ClientErrorInput)
    .mutation(async ({ input }) => {
      const mainMessage = `Client error (${input.source}): ${input.message}`;
      const details = [
        `Page: ${input.pageUrl}`,
        `UA: ${input.userAgent}`,
        `Time: ${input.timestamp}`,
        // absent for cross-origin script errors, which give no stack
        input.stack ? `Stack:\n\`\`\`${input.stack}\`\`\`` : null,
        // only present for render errors caught by ErrorBoundary
        input.componentStack ? `Component stack:\n\`\`\`${input.componentStack}\`\`\`` : null,
      // filter(Boolean) does not narrow string | null to string in TypeScript
      ].filter((x): x is string => x !== null).join('\n');

      // fire and forget. returning null, not undefined, avoids triggering overrideUndefinedResponse.
      slackAlert(env, [mainMessage, details], { batchKey: 'client-error' });
      return null;
    }),
});
