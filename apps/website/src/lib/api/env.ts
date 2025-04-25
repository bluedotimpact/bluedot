import { validateEnv } from '@bluedot/ui';

export default validateEnv([
  'APP_NAME',
  'AIRTABLE_PERSONAL_ACCESS_TOKEN',
  'COURSES_BASE_ID',
  'APPLICATIONS_BASE_ID',
  'ALERTS_SLACK_CHANNEL_ID',
  'ALERTS_SLACK_BOT_TOKEN',
]);
