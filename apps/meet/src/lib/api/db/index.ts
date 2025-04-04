import { AirtableTs } from 'airtable-ts';
import env from '../env';

export default new AirtableTs({
  apiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
});
