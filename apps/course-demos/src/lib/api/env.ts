import { validateEnv } from '@bluedot/ui';

const env = validateEnv([
  'APP_NAME',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'ALERTS_SLACK_CHANNEL_ID',
  'ALERTS_SLACK_BOT_TOKEN',
]);

export default env;
