import { validateEnv } from '@bluedot/utils';
import { isLocalPreview } from '../preview';

const env = isLocalPreview() ? {
  APP_NAME: 'team-apps',
  AIRTABLE_PERSONAL_ACCESS_TOKEN: '',
  PG_URL: '',
  ALERTS_SLACK_CHANNEL_ID: '',
  ALERTS_SLACK_BOT_TOKEN: 'IGNORE_SLACK_ALERTS',
  ANTHROPIC_API_KEY: '',
  AIRTABLE_AUTOMATION_TOKEN: '',
} : validateEnv({
  required: [
    'APP_NAME',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'PG_URL',
    'ALERTS_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
  // Only the web-lookup route needs these; without them it answers 500 and the rest of the app runs
  optional: ['ANTHROPIC_API_KEY', 'AIRTABLE_AUTOMATION_TOKEN'],
});

export default env;
