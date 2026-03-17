import { validateEnv } from '@bluedot/utils';

const env = validateEnv({
  required: [
    'APP_NAME',
    'AIRTABLE_PERSONAL_ACCESS_TOKEN',
    'PG_URL',
  ],
});

export default env;
