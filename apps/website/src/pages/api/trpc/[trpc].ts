import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import * as trpcNext from '@trpc/server/adapters/next';
import env from '../../../lib/api/env';
import { appRouter } from '../../../server/routers/_app';

// @link https://trpc.io/docs/v11/server/adapters
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => ({}),
  onError(opts) {
    const { error, type, path } = opts;

    const criticalErrors = [
      'TOO_MANY_REQUESTS', // HTTP 429
      'INTERNAL_SERVER_ERROR', // HTTP 500
      'NOT_IMPLEMENTED', // HTTP 501
      'BAD_GATEWAY', // HTTP 502
      'SERVICE_UNAVAILABLE', // HTTP 503
      'GATEWAY_TIMEOUT', // HTTP 504
    ];

    // Only alert on critical errors
    if (!criticalErrors.includes(error.code)) return;

    slackAlert(env, [
      `Error: Failed request on route ${path}, type ${type}: ${error.message}`,
      // Stack is sent as response to Slack thread
      `Stack:\n\`\`\`${error.stack}\`\`\``,
    ]).catch((slackError) => {
      // eslint-disable-next-line no-console
      console.error('Failed to send Slack alert:', slackError);
    });
  },
});
