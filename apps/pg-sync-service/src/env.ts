import { validateEnv } from '@bluedot/ui';

const env = validateEnv({
  required: [
    'APP_NAME',
    'PG_URL',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'ALERTS_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
  optional: [
    'PORT',
  ],
});

export default env;
