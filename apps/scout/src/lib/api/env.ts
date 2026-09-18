import { validateEnv } from '@bluedot/utils';

const env = validateEnv({
  required: [
    'APP_NAME',
    'PG_URL',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'ALERTS_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
  optional: [
    // Set to 'true' to let Invite / Not now write to Airtable. Off by default so
    // people trying the app out cannot stamp statuses or send invite emails.
    'SCOUT_WRITES_ENABLED',
  ],
});

export default env;
