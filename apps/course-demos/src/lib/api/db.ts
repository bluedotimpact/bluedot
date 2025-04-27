import { AirtableTs, Item, Table } from 'airtable-ts';
import { z } from 'zod';
import env from './env';

export default new AirtableTs({
  apiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
});

export const demoTypes = z.literal('generate-react-component');

export type SharedDemoOutput = {
  id: string,
  type: z.infer<typeof demoTypes>,
  data: string,
  createdAt: number,
} & Item;

export const sharedDemoOutputTable: Table<SharedDemoOutput> = {
  name: 'SharedComponents',
  baseId: 'appPs3sb9BrYZN69z',
  tableId: 'tbl9WE3N4B0OjocEB',
  mappings: {
    type: 'fldpAHTnZOJc8wbFV',
    data: 'fldsh10gNDXfkosfJ',
    createdAt: 'fldNfaTMCepyRY3Nj',
  },
  schema: {
    type: 'string',
    data: 'string',
    createdAt: 'number',
  },
};
