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
    // PostHog event shipping (env-specific project ingestion key — must match the website's project
    // for this env). Optional for now: the cron no-ops if unset. POSTHOG_HOST defaults to direct.
    'POSTHOG_PROJECT_API_KEY',
    'POSTHOG_HOST',
  ],
});

export default env;
