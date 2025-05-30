import { validateEnv } from '@bluedot/ui/src/api';

const env = validateEnv([
  'APP_NAME',
  'DISPLAY_BEARER_TOKEN',
  'ALERTS_SLACK_CHANNEL_ID',
  'ALERTS_SLACK_BOT_TOKEN',
]);

export default env;
