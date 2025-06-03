import { validateEnv } from '@bluedot/ui';

export default validateEnv({
  required: [
    'APP_NAME',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'ALERTS_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
});
