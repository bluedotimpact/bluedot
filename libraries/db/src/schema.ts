import {
  pgTable, text, boolean, numeric, timestamp,
} from 'drizzle-orm/pg-core';
import { pgAirtable } from './lib/db-core';

const COURSE_BUILDER_BASE_ID = 'appbiNKDcn1sGPGOG';
const APPLICATIONS_BASE_ID = 'appnJbsG1eWbAdEvf';
const COURSE_RUNNER_BASE_ID = 'appPs3sb9BrYZN69z';
const AVAILABILITY_FORMS_BASE_ID = 'app6dkBHka8c4WaEj';
const MOCK_DATA_BASE_ID = 'appRcVrzrkGoSrfR4';
const WEB_CONTENT_BASE_ID = 'app63L1YChHfS6RJF';

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

/**
 * Table used to track sync operations and their status.
 * This helps determine when initial sync is needed.
 */
export const syncMetadataTable = pgTable('sync_metadata', {
  id: text().primaryKey().default('singleton'), // Single row table
  lastFullSyncAt: timestamp(),
  lastIncrementalSyncAt: timestamp(),
  syncInProgress: boolean().default(false),
  lastSyncStatus: text(), // 'success', 'failed', 'in_progress'
  lastSyncError: text(),
  updatedAt: timestamp().defaultNow(),
});

export const courseTable = pgAirtable('course', {
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

export const unitFeedbackTable = pgAirtable('unit_feedback', {
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

export const exerciseResponseTable = pgAirtable('exercise_response', {
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

export const formConfigurationTable = pgAirtable('form_configuration', {
  baseId: AVAILABILITY_FORMS_BASE_ID,
  tableId: 'tblvsaRl69XV8azGZ',
  columns: {
    slug: {
      pgColumn: text(),
      airtableId: 'fldrw0oSjFSMezFJ2',
    },
    title: {
      pgColumn: text(),
      airtableId: 'fldHiGrJmyBvSdGUm',
    },
    webhook: {
      pgColumn: text(),
      airtableId: 'fldoGERxuxQ17adXI',
    },
    minimumLength: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldUiReJ8a7hdV37E',
    },
  },
});

export const personTable = pgAirtable('person', {
  baseId: MOCK_DATA_BASE_ID,
  tableId: 'tblA0UsJCiOt9MN0k',
  columns: {
    email: {
      pgColumn: text(),
      airtableId: 'fldJzIWg2HMBmwPjZ',
    },
    firstName: {
      pgColumn: text(),
      airtableId: 'fldxyoC98EoVQDrqa',
    },
    lastName: {
      pgColumn: text(),
      airtableId: 'fldrfvKXru0YEXLvh',
    },
    ethnicGroup: {
      pgColumn: text(),
      airtableId: 'fldaLQ2MnUVa9tdRf',
    },
    careerPlans: {
      pgColumn: text(),
      airtableId: 'fldqq4LyZ5pf26NsN',
    },
    biography: {
      pgColumn: text(),
      airtableId: 'fldg9GSGb1dY59kf4',
    },
    appliedToOpportunities: {
      pgColumn: text().array(),
      airtableId: 'fldhI1cqdvrXwbJb7',
    },
    isProfilePublic: {
      pgColumn: boolean(),
      airtableId: 'fldNW3O0U3vCBk0Nf',
    },
  },
});

export const opportunityTable = pgAirtable('opportunity', {
  baseId: MOCK_DATA_BASE_ID,
  tableId: 'tblneFg0pOTRI3kfD',
  columns: {
    title: {
      pgColumn: text(),
      airtableId: 'fldEMP8VzGIUGD1l6',
    },
    organizationName: {
      pgColumn: text(),
      airtableId: 'fldpvKKPIODumUdfj',
    },
    opportunitySummary: {
      pgColumn: text(),
      airtableId: 'fldSJWSbDKXITt71D',
    },
    opportunityDescription: {
      pgColumn: text(),
      airtableId: 'fldO5FAmTx20HixOT',
    },
    applicants: {
      pgColumn: text().array(),
      airtableId: 'fldOCFhSNFqg12mjO',
    },
  },
});

export const sharedDemoOutputTable = pgAirtable('shared_demo_output', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tbl9WE3N4B0OjocEB',
  columns: {
    type: {
      pgColumn: text(),
      airtableId: 'fldpAHTnZOJc8wbFV',
    },
    data: {
      pgColumn: text(),
      airtableId: 'fldsh10gNDXfkosfJ',
    },
    createdAt: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldNfaTMCepyRY3Nj',
    },
  },
});

export const groupTable = pgAirtable('group', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblyiJSPoniwhi17T',
  columns: {
    groupDiscussions: {
      pgColumn: text().array(),
      airtableId: 'fldwEeC65sHvGGRGb',
    },
    round: {
      pgColumn: text(),
      airtableId: 'fldtzy3nSP0piVApO',
    },
  },
});

export const groupDiscussionTable = pgAirtable('group_discussion', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblDNME0bA9OoApTk',
  columns: {
    facilitators: {
      pgColumn: text().array(),
      airtableId: 'fldP5BqdFfcn8enfc',
    },
    participantsExpected: {
      pgColumn: text().array(),
      airtableId: 'fldEKYwcacAa6nBEE',
    },
    attendees: {
      pgColumn: text().array(),
      airtableId: 'fldo0xEi6vJKSJlFN',
    },
    startDateTime: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'flduTqIxS6OEHNr4H',
    },
    endDateTime: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'flda1ONwG37ROVo8e',
    },
    group: {
      pgColumn: text(),
      airtableId: 'fldjISs1XFGAwT5k5',
    },
    zoomAccount: {
      pgColumn: text(),
      airtableId: 'fldH0pKnEELPI65Qs',
    },
  },
});

export const meetPersonTable = pgAirtable('meet_person', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblBeMxAM1FAW06n4',
  columns: {
    name: {
      pgColumn: text(),
      airtableId: 'fldP4ejaYy137J5Md',
    },
  },
});

export const zoomAccountTable = pgAirtable('zoom_account', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblF61F1xXUnpB13S',
  columns: {
    meetingLink: {
      pgColumn: text(),
      airtableId: 'fldF5V0uf7jYAxHu5',
    },
    hostKey: {
      pgColumn: text(),
      airtableId: 'fldprdNVzdeAU1cRH',
    },
  },
});

export const roundTable = pgAirtable('round', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblu6u7F2NHfCMgsk',
  columns: {
    course: {
      pgColumn: text(),
      airtableId: 'fldvx7D6Uw0VxMPr0',
    },
  },
});

export const meetCourseTable = pgAirtable('meet_course', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblO0sgD3ioedaqDw',
  columns: {
    courseSite: {
      pgColumn: text(),
      airtableId: 'fldzJ2h89blzv6MSb',
    },
  },
});

export const blogTable = pgAirtable('blog', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tblT8jgeG4QWX2Fj4',
  columns: {
    title: {
      pgColumn: text(),
      airtableId: 'fldB4uHuTqUd4JOsw',
    },
    slug: {
      pgColumn: text(),
      airtableId: 'fldSy5THCV7WOtYiN',
    },
    body: {
      pgColumn: text(),
      airtableId: 'fldesLVb1tJpsNkVl',
    },
    authorName: {
      pgColumn: text(),
      airtableId: 'fldBVD1meb54zRK8Q',
    },
    authorUrl: {
      pgColumn: text(),
      airtableId: 'fldEOlPQdbEmDxicJ',
    },
    publishedAt: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldjp3x46apAPAXo7',
    },
    publicationStatus: {
      pgColumn: text(),
      airtableId: 'fldiDvLbKKWNPeny4',
    },
  },
});

export const jobPostingTable = pgAirtable('job_posting', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tblGv8yisIfJMjT6K',
  columns: {
    title: {
      pgColumn: text(),
      airtableId: 'fldN51J9NLxyRBEDf',
    },
    subtitle: {
      pgColumn: text(),
      airtableId: 'fldhiAectnNMEmUt5',
    },
    slug: {
      pgColumn: text(),
      airtableId: 'fldiMgiy9wHuvIM2f',
    },
    applicationUrl: {
      pgColumn: text(),
      airtableId: 'fldtkliaGs8JLy0BS',
    },
    body: {
      pgColumn: text(),
      airtableId: 'fldiBF58TPRIMhgvq',
    },
    publicationStatus: {
      pgColumn: text(),
      airtableId: 'fld4cZjg7YiEDaZXg',
    },
  },
});

export const projectTable = pgAirtable('project', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tblYCFWqPy29YIWe6',
  columns: {
    title: {
      pgColumn: text(),
      airtableId: 'fldGyQnG2U6q5p5ny',
    },
    slug: {
      pgColumn: text(),
      airtableId: 'fldX2rzTLpj9P9fdP',
    },
    body: {
      pgColumn: text(),
      airtableId: 'fldjW7BnaXVCttBQn',
    },
    authorName: {
      pgColumn: text(),
      airtableId: 'fldGpZHynFhhAx13S',
    },
    authorUrl: {
      pgColumn: text(),
      airtableId: 'fldJiHv2mFQzEdz7L',
    },
    coverImageSrc: {
      pgColumn: text(),
      airtableId: 'fldliLiVCys4rLX7S',
    },
    publishedAt: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldoTpdgfEBNQgej9',
    },
    publicationStatus: {
      pgColumn: text(),
      airtableId: 'fldn7RrnTe80QUEt6',
    },
    course: {
      pgColumn: text(),
      airtableId: 'fldNHNMuxmQjaokmY',
    },
    tag: {
      pgColumn: text().array(),
      airtableId: 'fldeTqWZOvybdopnK',
    },
  },
});
