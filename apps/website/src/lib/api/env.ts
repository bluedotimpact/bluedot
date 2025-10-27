import { validateEnv } from '@bluedot/utils';

export default validateEnv({
  required: [
    'APP_NAME',
    'PG_URL',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'ALERTS_SLACK_CHANNEL_ID',
    'ALERTS_SLACK_BOT_TOKEN',
    'KEYCLOAK_CLIENT_ID',
    'KEYCLOAK_CLIENT_SECRET',
  ],
  optional: [
    'CERTIFICATE_CREATION_TOKEN',
  ],
});
