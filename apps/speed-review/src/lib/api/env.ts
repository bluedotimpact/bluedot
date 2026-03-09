import { validateEnv } from '@bluedot/utils';

const env = validateEnv({
  required: [
    'APP_NAME',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'AIRTABLE_BASE_ID',
    'AIRTABLE_TABLE_ID',
    'ALERTS_SLACK_BOT_TOKEN',
    'ALERTS_SLACK_CHANNEL_ID',
    'INFO_SLACK_CHANNEL_ID',
  ],
});

export default env;
