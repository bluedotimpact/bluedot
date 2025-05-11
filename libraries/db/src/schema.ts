import {
  pgTable, text, boolean, timestamp,
} from 'drizzle-orm/pg-core';
import { pgAirtable } from './lib/db-core';

// FIXME envvar handling
const COURSE_BUILDER_BASE_ID = process.env.COURSE_BUILDER_BASE_ID || 'appbiNKDcn1sGPGOG';
const APPLICATIONS_BASE_ID = process.env.APPLICATIONS_BASE_ID || 'appnJbsG1eWbAdEvf';

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
  baseId: COURSE_BUILDER_BASE_ID,
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
