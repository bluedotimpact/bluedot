import { loginPresets } from '@bluedot/ui';
import { makeMakeApiRoute } from '@bluedot/ui/src/api';
import env from './env';

export const makeApiRoute = makeMakeApiRoute({
  env: {
    ...env,
    ALERTS_SLACK_BOT_TOKEN: '',
    ALERTS_SLACK_CHANNEL_ID: '',
  },
  verifyAndDecodeToken: loginPresets.keycloak.verifyAndDecodeToken,
});
