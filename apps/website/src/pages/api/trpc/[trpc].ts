import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import * as trpcNext from '@trpc/server/adapters/next';
import env from '../../../lib/api/env';
import { createContext } from '../../../server/context';
import { appRouter } from '../../../server/routers/_app';

// @link https://trpc.io/docs/v11/server/adapters
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  onError(opts) {
    const { error, type, path } = opts;

    const serverErrors = [
      'INTERNAL_SERVER_ERROR', // HTTP 500
      'NOT_IMPLEMENTED', // HTTP 501
      'BAD_GATEWAY', // HTTP 502
      'SERVICE_UNAVAILABLE', // HTTP 503
      'GATEWAY_TIMEOUT', // HTTP 504
    ];

    // Only log client errors (4xx)
    if (!serverErrors.includes(error.code)) {
      logger.warn('Client error handling request:', error);
      return;
    }

    // Log and alert on server errors (5xx)
    logger.error('Internal error handling request:', error);
    slackAlert(env, [
      `Error: Failed request on route ${path}, type ${type}: ${error.message}`,
      // Stack is sent as response to Slack thread
      `Stack:\n\`\`\`${error.stack}\`\`\``,
    ], { immediate: true }).catch((slackError) => {
      logger.error('Failed to send Slack alert:', slackError);
    });
  },
});
