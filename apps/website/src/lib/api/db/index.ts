import { PgAirtableDb } from '@bluedot/db';
import { slackAlert } from '@bluedot/utils';
import env from '../env';

export default new PgAirtableDb({
  pgConnString: env.PG_URL,
  airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
  airtableTsOptions: {
    validationMode: 'warn-and-retry',
    onWarning: (warning: string) => slackAlert(env, [warning]),
  },
});
