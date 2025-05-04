import { pgTable, text, boolean } from 'drizzle-orm/pg-core';
import { pgAirtable } from './lib/db-core';
import { timestamp } from 'drizzle-orm/pg-core';

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

export const userTable = pgAirtable('user', {
  baseId: 'appgnRJNcgW90cbj0', // Copy of "Course builder" that isn't connected to anything (TODO make it possible to use env vars for this)
  tableId: 'tblCgeKADNDSCXPpR',
  columns: {
    email: {
      pgColumn: text(),
      airtableId: 'fldLAGRfn7S6uEVRo',
    },
    name: {
      pgColumn: text(),
      airtableId: 'fldULI4CXDWAUmRM2',
    },
    completedMoocAt: {
      pgColumn: timestamp(),
      airtableId: 'fldTCSAIKNs4nPfDn',
    },
  },
});
