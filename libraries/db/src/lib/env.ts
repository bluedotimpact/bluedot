// import { validateEnv } from '@bluedot/ui';

// TODO parcel out into utils/ package
const validateEnv = (...args: any[]) => process.env;

const env = validateEnv({
  required: [
    'APP_NAME',
    'PG_URL',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'ALERTS_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
  optional: [
    'COURSE_BUILDER_BASE_ID',
    'APPLICATIONS_BASE_ID',
  ],
});

export default env;
