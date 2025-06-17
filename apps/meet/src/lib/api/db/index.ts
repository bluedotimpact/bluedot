import { PgAirtableDb } from '@bluedot/db';
import env from '../env';

export default new PgAirtableDb({
  pgConnString: env.PG_URL,
  airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
});
