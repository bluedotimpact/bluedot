import { AirtableTs, Table, Item } from 'airtable-ts';
import env from './env';

export default new AirtableTs({
  apiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
});

export interface FormConfiguration extends Item {
  'Slug': string,
  'Title': string,
  'Webhook': string,
  'Minimum length': number,
}

export const formConfigurationTable: Table<FormConfiguration> = {
  name: 'form configuration',
  baseId: 'app6dkBHka8c4WaEj',
  tableId: 'tblvsaRl69XV8azGZ',
  schema: {
    Slug: 'string',
    Title: 'string',
    Webhook: 'string',
    'Minimum length': 'number',
  },
};
