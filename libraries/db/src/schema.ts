import {
  pgTable, text, boolean, numeric,
} from 'drizzle-orm/pg-core';
import { pgAirtable } from './lib/db-core';
import env from './lib/env';

const { COURSE_BUILDER_BASE_ID = 'appbiNKDcn1sGPGOG' } = env;
const { APPLICATIONS_BASE_ID = 'appnJbsG1eWbAdEvf' } = env;

// TODO remove before merging
if (COURSE_BUILDER_BASE_ID === 'appbiNKDcn1sGPGOG' || APPLICATIONS_BASE_ID === 'appnJbsG1eWbAdEvf') {
  throw new Error("Using prod database, you probably didn't mean to do this");
}

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

export const unitFeedbackTable = pgAirtable('UnitFeedback', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tblBwjMjul1c6l7ea',
  columns: {
    unitId: {
      pgColumn: text(),
      airtableId: 'fldYqvWII6kuxCCmH',
    },
    overallRating: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld3B8HUudN5NxPIU',
    },
    anythingElse: {
      pgColumn: text(),
      airtableId: 'fldYdcPZPdJAqn06w',
    },
    userEmail: {
      pgColumn: text(),
      airtableId: 'fld9JsHJXjud5Bhle',
    },
    userFullName: {
      pgColumn: text(),
      airtableId: 'fldPG0z0SRFcGJhNW',
    },
    createdAt: {
      pgColumn: text(),
      airtableId: 'fldWyJJz3OVNK0kTn',
    },
    lastModified: {
      pgColumn: text(),
      airtableId: 'fldCQ0O6oOf4BcMpJ',
    },
  },
});
export const unitFeedbackTablePg = unitFeedbackTable.pg;

export const exerciseResponseTable = pgAirtable('ExerciseResponse', {
  baseId: APPLICATIONS_BASE_ID,
  tableId: 'tblLNijbqwoLtkd3O',
  columns: {
    email: {
      pgColumn: text(),
      airtableId: 'fldI5oHurlbNjQJmM',
    },
    exerciseId: {
      pgColumn: text(),
      airtableId: 'fldSKltln4l3yYdi2',
    },
    response: {
      pgColumn: text(),
      airtableId: 'fld7Qa3JDnRNwCTlH',
    },
    completed: {
      pgColumn: boolean(),
      airtableId: 'fldz8rocQd7Ws9s2q',
    },
  },
});
export const exerciseResponseTablePg = exerciseResponseTable.pg;
