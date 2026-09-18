import { validateEnv } from '@bluedot/utils';
import { isLocalPreview } from '../preview';

const env = isLocalPreview() ? {
  APP_NAME: 'speed-review',
  AIRTABLE_PERSONAL_ACCESS_TOKEN: '',
  PG_URL: '',
  ALERTS_SLACK_CHANNEL_ID: '',
  ALERTS_SLACK_BOT_TOKEN: 'IGNORE_SLACK_ALERTS',
} : validateEnv({
  required: [
    'APP_NAME',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'PG_URL',
    'ALERTS_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
});

export default env;
