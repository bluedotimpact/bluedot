import { validateEnv } from '@bluedot/utils';

const env = validateEnv({
  required: [
    'APP_NAME',
    'PG_URL',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'ALERTS_SLACK_CHANNEL_ID',
    'INFO_SLACK_CHANNEL_ID',
    'PG_SYNC_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
  optional: [
    'PORT',
    'PROD_ONLY_WEBHOOK_DELETION',
    'VITEST',
    // Must match the project website/ uses
    'POSTHOG_PROJECT_API_KEY',
    'POSTHOG_HOST',
    // Build tag (`YYYYMMDD.HHMMSS.<git-short-sha>`) baked into the image; stamped onto emitted PostHog events
    'VERSION_TAG',
  ],
});

export default env;
