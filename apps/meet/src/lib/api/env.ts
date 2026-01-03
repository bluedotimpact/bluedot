import { validateEnv } from '@bluedot/utils';

export default validateEnv({
  required: [
    'APP_NAME',
    'PG_URL',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',

    'NEXT_PUBLIC_ZOOM_CLIENT_ID',
    'ZOOM_CLIENT_SECRET',

    'ALERTS_SLACK_CHANNEL_ID',
    'INFO_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
  ],
});
