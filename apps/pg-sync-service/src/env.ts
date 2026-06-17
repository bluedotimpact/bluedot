import { validateEnv } from '@bluedot/utils';

const env = validateEnv({
  required: [
    'APP_NAME',
    'PG_URL',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'ALERTS_SLACK_CHANNEL_ID',
    'INFO_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
  optional: [
    'PORT',
    'PROD_ONLY_WEBHOOK_DELETION',
    'VITEST',
    // Must match the project website/ uses
    'POSTHOG_PROJECT_API_KEY',
    'POSTHOG_HOST',
  ],
});

export default env;
