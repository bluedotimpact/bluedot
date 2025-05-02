import { validateEnv } from '@bluedot/ui/src/api';

export default validateEnv([
  'APP_NAME',
  'AIRTABLE_PERSONAL_ACCESS_TOKEN',

  'NEXT_PUBLIC_ZOOM_CLIENT_ID',
  'ZOOM_CLIENT_SECRET',

  'ALERTS_SLACK_CHANNEL_ID',
  'ALERTS_SLACK_BOT_TOKEN',
]);
