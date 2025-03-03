import { validateEnv } from '@bluedot/ui';

const env = validateEnv([
  'APP_NAME',
  'ANTHROPIC_API_KEY',
  'ALERTS_SLACK_BOT_TOKEN',
  'ALERTS_SLACK_CHANNEL_ID',
]);

export default env;
