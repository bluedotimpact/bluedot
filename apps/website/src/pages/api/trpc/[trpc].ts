import { logger } from '@bluedot/ui/src/api';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import * as trpcNext from '@trpc/server/adapters/next';
import env from '../../../lib/api/env';
import { createContext } from '../../../server/context';
import { appRouter } from '../../../server/routers/_app';
import { AuthenticationRequiredError } from '../../../server/trpc';

// @link https://trpc.io/docs/v11/server/adapters
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext,
  onError(opts) {
    const { error, type, path, req } = opts;

    // A request with no token hitting a protected procedure is routine
    // client/server disagreement, not an anomaly: queries scheduled before a
    // logout are dispatched after it, once the client has already dropped the
    // token. A request that carries a token but fails verification still warns
    // here, and createContext logs it separately. UNAUTHORIZED from anything
    // else (bad shared secret, tampered link) is real signal, so only the
    // protected-procedure error is suppressed.
    if (error instanceof AuthenticationRequiredError && !req.headers.authorization) {
      return;
    }

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
    ], { batchKey: 'trpc-server-errors' }).catch((slackError: unknown) => {
      logger.error('Failed to send Slack alert:', slackError);
    });
  },
});
