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
    const message = `tRPC Error: ${error.code} | ${error.message}\nType: ${type} | Path: ${path}`;

    slackAlert(env, [message]).catch((slackError) => {
      // eslint-disable-next-line no-console
      console.error('Failed to send Slack alert:', slackError);
    });
  },
});
