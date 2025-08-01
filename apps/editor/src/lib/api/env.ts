import { validateEnv } from '@bluedot/utils';

const env = validateEnv({
  required: [
    'APP_NAME',
    'PG_URL',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'ALERTS_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
    'WEBSITE_ASSETS_BUCKET_ACCESS_KEY_ID',
    'WEBSITE_ASSETS_BUCKET_SECRET_ACCESS_KEY',
  ],
});

export default env;
