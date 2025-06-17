import { PgAirtableDb } from '@bluedot/db';
import { z } from 'zod';
import env from './env';

export default new PgAirtableDb({
  pgConnString: env.PG_URL,
  airtableApiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
});

export const demoTypes = z.literal('generate-react-component');
