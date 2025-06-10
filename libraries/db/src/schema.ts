import {
  pgTable, text, boolean,
} from 'drizzle-orm/pg-core';
import { pgAirtable } from './lib/db-core';
import env from './lib/env';

const { COURSE_BUILDER_BASE_ID = 'appgnRJNcgW90cbj0' } = env;
const { APPLICATIONS_BASE_ID = 'appnJbsG1eWbAdEvf' } = env;

/**
 * Table used to track the link between fields in Airtable and their corresponding field
 * in this Postgres db. Note that this is a regular `pgTable`, so is not itself synced. Tables
 * that need to be synced should use `pgAirtable`.
 */
export const metaTable = pgTable('meta', {
  enabled: boolean().default(true),
  airtableBaseId: text().notNull(),
  airtableTableId: text().notNull(),
  airtableFieldId: text().notNull(),
  pgTable: text().notNull(),
  pgField: text().notNull(),
});

export const userTable = pgAirtable('User', {
  baseId: COURSE_BUILDER_BASE_ID,
  // tableId: 'tbl8aI1ksljv2qZv3',
  tableId: 'tblUItn8S57DxuGR8', // TODO revert, this is a test base
  columns: {
    email: {
      pgColumn: text(),
      // airtableId: 'fldOkUOWaZGphtQWF',
      airtableId: 'fldEU3o8XWg5sPkMw', // TODO revert, this is a test base
    },
    name: {
      pgColumn: text(),
      // airtableId: 'fldQWsI7eAhnPQjQx',
      airtableId: 'fldKNUVGtsr9TD4e0', // TODO revert, this is a test base
    },
    completedMoocAt: {
      // Note: Currently this is text() to avoid having to create a robust type mapping
      // between airtable and postgres, over time we can migrate types that become important
      pgColumn: text(),
      // airtableId: 'fldiSuoXoyW50n4yp',
      airtableId: 'fldZMGgpQJ4voCtv6', // TODO revert, this is a test base
    },
  },
});
export const userTablePg = userTable.pg;
