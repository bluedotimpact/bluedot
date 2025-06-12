import { PgAirtableDb } from '@bluedot/db';
import env from '../env';

export const db = new PgAirtableDb({ pgConnString: env.PG_URL, airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN });
