import { validateEnv } from '@bluedot/ui';

const env = validateEnv([
  'APP_NAME',
  'AIRTABLE_PERSONAL_ACCESS_TOKEN',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'ALERTS_SLACK_CHANNEL_ID',
  'ALERTS_SLACK_BOT_TOKEN',
]);

export default env;
