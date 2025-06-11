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

export const courseTable = pgAirtable('Course', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tbl6nq5AVLKINBJ73',
  columns: {
    certificationBadgeImage: {
      pgColumn: text(),
      airtableId: 'fldwOxukk9OyUPWDX',
    },
    certificatonDescription: {
      pgColumn: text(),
      airtableId: 'fldsxyHg4BLouu7XZ',
    },
    description: {
      pgColumn: text(),
      airtableId: 'fldCX0bk6SQuXZaI7',
    },
    detailsUrl: {
      pgColumn: text(),
      airtableId: 'fldblKROooVG5p9UW',
    },
    displayOnCourseHubIndex: {
      pgColumn: boolean(),
      airtableId: 'fldf7ppu9kN4blXU9',
    },
    // TODO re-add these. They don't exist in my copy
    // durationDescription: {
    //   pgColumn: text(),
    //   airtableId: 'fldHxekJ6BioQMF3e',
    // },
    // durationHours: {
    //   pgColumn: numeric({ mode: 'number' }),
    //   airtableId: 'fld77qMwZ1de2owvx',
    // },
    // image: {
    //   pgColumn: text(),
    //   airtableId: 'fldh90A6x8HwQSkMy',
    // },
    slug: {
      pgColumn: text(),
      airtableId: 'fldHWXKaVuHJAaMbP',
    },
    path: {
      pgColumn: text(),
      airtableId: 'fldEjx0ZP8SNYcNQR',
    },
    // TODO re-add these. They don't exist in my copy
    // shortDescription: {
    //   pgColumn: text(),
    //   airtableId: 'fld0KVXjcZkSpBOIT',
    // },
    title: {
      pgColumn: text(),
      airtableId: 'fldUyKGqFb7OiY0KF',
    },
    units: {
      pgColumn: text().array(),
      airtableId: 'fldxi3h4LD2Bs3efO',
    },
    cadence: {
      pgColumn: text(),
      airtableId: 'fldTI1NI7ocFIWcmv',
    },
    // TODO re-add these. They don't exist in my copy
    // level: {
    //   pgColumn: text(),
    //   airtableId: 'fldkL7aWITGCPqzxc',
    // },
    // averageRating: {
    //   pgColumn: numeric({ mode: 'number' }),
    //   airtableId: 'fldONpnyJ4OG0StDY',
    // },
    // publicLastUpdated: {
    //   pgColumn: text(),
    //   airtableId: 'fld8g5mMsPqOm75Vz',
    // },
  },
});
export const courseTablePg = courseTable.pg;

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
