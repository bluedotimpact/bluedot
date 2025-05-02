import { validateEnv } from '@bluedot/ui/src/api';

export default validateEnv([
  'APP_NAME',
  'BUBBLE_SHARED_SECRET',
  'KEYCLOAK_CLIENT_SECRET',
  'ALERTS_SLACK_CHANNEL_ID',
  'ALERTS_SLACK_BOT_TOKEN',
]);
