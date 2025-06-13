import { validateEnv } from '@bluedot/utils';

export default validateEnv({
  required: [
    'APP_NAME',
    'BUBBLE_SHARED_SECRET',
    'KEYCLOAK_CLIENT_SECRET',
    'ALERTS_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
});
