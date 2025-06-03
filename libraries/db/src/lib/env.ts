import { validateEnv } from '@bluedot/ui';

const env = validateEnv([
  'APP_NAME',
  'PG_URL',
  'AIRTABLE_PERSONAL_ACCESS_TOKEN',
  'ALERTS_SLACK_CHANNEL_ID',
  'ALERTS_SLACK_BOT_TOKEN',
  // TODO make these optional
  'COURSE_BUILDER_BASE_ID',
  'APPLICATIONS_BASE_ID',
]);

export default env;
