import {
  pgTable, text, boolean, numeric, timestamp,
  serial,
} from 'drizzle-orm/pg-core';
import { type InferSelectModel } from 'drizzle-orm';

import { pgAirtable } from './lib/db-core';

const COURSE_BUILDER_BASE_ID = 'appbiNKDcn1sGPGOG';
const APPLICATIONS_BASE_ID = 'appnJbsG1eWbAdEvf';
const COURSE_RUNNER_BASE_ID = 'appPs3sb9BrYZN69z';
const AVAILABILITY_FORMS_BASE_ID = 'app6dkBHka8c4WaEj';
const MOCK_DATA_BASE_ID = 'appRcVrzrkGoSrfR4';
const WEB_CONTENT_BASE_ID = 'app63L1YChHfS6RJF';
const CONTRACTOR_PAYMENTS_BASE_ID = 'appMVNtdBtvtJvu5E';

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

// Define sync status type
export type SyncStatus = 'queued' | 'running' | 'completed';

/**
 * Table to track manual sync requests from the admin dashboard.
 * NOTE: This is a regular pgTable, NOT synced from Airtable.
 * Used to queue and track pg-sync operations.
 */
export const syncRequestsTable = pgTable('sync_requests', {
  id: serial().primaryKey(),
  requestedBy: text().notNull(),
  status: text().$type<SyncStatus>().default('queued').notNull(),
  requestedAt: timestamp().defaultNow().notNull(),
  startedAt: timestamp(),
  completedAt: timestamp(),
});

export const courseTable = pgAirtable('course', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tbl6nq5AVLKINBJ73',
  columns: {
    certificationBadgeImage: {
      pgColumn: text(),
      airtableId: 'fldwOxukk9OyUPWDX',
    },
    certificationDescription: {
      pgColumn: text(),
      airtableId: 'fldsxyHg4BLouu7XZ',
    },
    detailsUrl: {
      pgColumn: text(),
      airtableId: 'fldlnWDzZZPZHP6S1',
    },
    displayOnCourseHubIndex: {
      pgColumn: boolean(),
      airtableId: 'fldf7ppu9kN4blXU9',
    },
    durationDescription: {
      pgColumn: text(),
      airtableId: 'fldHxekJ6BioQMF3e',
    },
    durationHours: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld77qMwZ1de2owvx',
    },
    slug: {
      pgColumn: text().notNull(),
      airtableId: 'fldHWXKaVuHJAaMbP',
    },
    shortDescription: {
      pgColumn: text().notNull(),
      airtableId: 'fld0KVXjcZkSpBOIT',
    },
    title: {
      pgColumn: text().notNull(),
      airtableId: 'fldUyKGqFb7OiY0KF',
    },
    units: {
      pgColumn: text().array().notNull(),
      airtableId: 'fldxi3h4LD2Bs3efO',
    },
    level: {
      pgColumn: text(),
      airtableId: 'fldkL7aWITGCPqzxc',
    },
    averageRating: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldONpnyJ4OG0StDY',
    },
    publicLastUpdated: {
      pgColumn: text(),
      airtableId: 'fld8g5mMsPqOm75Vz',
    },
    isNew: {
      pgColumn: boolean(),
      airtableId: 'fldFFndUplP3mEFe7',
    },
    isFeatured: {
      pgColumn: boolean(),
      airtableId: 'fldDXwQyHpHtUspFY',
    },
    status: {
      pgColumn: text(),
      airtableId: 'fldaEypOAkLCFfYBQ',
    },
    type: {
      pgColumn: text(),
      airtableId: 'fldqjfkW48dIB1dB2',
    },
    applyUrl: {
      pgColumn: text(),
      airtableId: 'fldAtb3GHlRNpYzwC',
    },
  },
  deprecatedColumns: {
    image: {
      pgColumn: text(),
      airtableId: 'fldh90A6x8HwQSkMy',
      deprecated: true,
    },
    path: {
      pgColumn: text(),
      airtableId: 'fldEjx0ZP8SNYcNQR',
      deprecated: true,
    },
    description: {
      pgColumn: text(),
      airtableId: 'fldCX0bk6SQuXZaI7',
      deprecated: true,
    },
  },
});

export const exerciseResponseTable = pgAirtable('exercise_response', {
  baseId: APPLICATIONS_BASE_ID,
  tableId: 'tblLNijbqwoLtkd3O',
  columns: {
    email: {
      pgColumn: text().notNull(),
      airtableId: 'fldI5oHurlbNjQJmM',
    },
    exerciseId: {
      pgColumn: text().notNull(),
      airtableId: 'fldSKltln4l3yYdi2',
    },
    response: {
      pgColumn: text().notNull(),
      airtableId: 'fld7Qa3JDnRNwCTlH',
    },
    completedAt: {
      pgColumn: text(),
      airtableId: 'fldmmwUvlAy3Ju2or',
    },
    autoNumberId: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldjhCZEuocd5eYsb',
    },
  },
  deprecatedColumns: {
    completed: {
      pgColumn: boolean(),
      airtableId: 'fldz8rocQd7Ws9s2q',
      deprecated: true,
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
    groupName: {
      pgColumn: text(),
      airtableId: 'fldv3jHyWGjR0LxLp',
    },
    groupDiscussions: {
      pgColumn: text().array(),
      airtableId: 'fldwEeC65sHvGGRGb',
    },
    round: {
      pgColumn: text(),
      airtableId: 'fldtzy3nSP0piVApO',
    },
    participants: {
      pgColumn: text().array(),
      airtableId: 'fldcEa25oCDAmgDqm',
    },
    /**
     * Multi-select of Human opinion values (e.g. "Strong yes", "Weak yes", "Neutral").
     * A participant can switch into this group if their humanOpinion matches one of the values.
     */
    whoCanSwitchIntoThisGroup: {
      pgColumn: text().array(),
      airtableId: 'fldVQihgKyx6nJIR5',
    },
    autoNumberId: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldMS1Hxn8OOO5vUb',
    },
    /** Datetime of first session, can also be used to infer recurring session time */
    startTimeUtc: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldim9d4xwSmw0QeI',
    },
    /** FK to meetPerson table */
    facilitator: {
      pgColumn: text().array(),
      airtableId: 'fld7P1XI03ToIqthj',
    },
  },
});

export const groupDiscussionTable = pgAirtable('group_discussion', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblDNME0bA9OoApTk',
  columns: {
    facilitators: {
      pgColumn: text().array().notNull(),
      airtableId: 'fldP5BqdFfcn8enfc',
    },
    participantsExpected: {
      pgColumn: text().array().notNull(),
      airtableId: 'fldEKYwcacAa6nBEE',
    },
    attendees: {
      pgColumn: text().array(),
      airtableId: 'fldo0xEi6vJKSJlFN',
    },
    startDateTime: {
      pgColumn: numeric({ mode: 'number' }).notNull(),
      airtableId: 'flduTqIxS6OEHNr4H',
    },
    endDateTime: {
      pgColumn: numeric({ mode: 'number' }).notNull(),
      airtableId: 'flda1ONwG37ROVo8e',
    },
    group: {
      pgColumn: text().notNull(),
      airtableId: 'fldjISs1XFGAwT5k5',
    },
    zoomAccount: {
      pgColumn: text(),
      airtableId: 'fldH0pKnEELPI65Qs',
    },
    courseSite: {
      pgColumn: text(),
      airtableId: 'fldRV2aVcMiNZMViJ',
    },
    unitNumber: { // this is a derived field and should be removed
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldbNYACt7S5J2QlU',
    },
    unit: {
      pgColumn: text(),
      airtableId: 'fldVo5h9rqsEeGSRU',
    },
    zoomLink: {
      pgColumn: text(),
      airtableId: 'fld5H5CNHA0B0EnYF',
    },
    activityDoc: {
      pgColumn: text(),
      airtableId: 'fldR74MrOB3EvDnmw',
    },
    slackChannelId: {
      pgColumn: text(),
      airtableId: 'fldYFQwPDKdzIAy93',
    },
    round: {
      pgColumn: text(),
      airtableId: 'fld6z76NthgaFf8EY',
    },
    courseBuilderUnitRecordId: {
      pgColumn: text(),
      airtableId: 'fld87QFyiHceHbpKG',
    },
    /**
     * Format: "{unitNumber}: {unit.title}". This field exists to retain the unit title if the
     * unit is deleted or disconnected, use as a fallback any time you need to render the unit title of a discussion.
     */
    unitFallback: {
      pgColumn: text(),
      airtableId: 'fldyVGCyb9026vDkK',
    },
    autoNumberId: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldDeRm7N60URakjA',
    },
  },
});

export const groupSwitchingTable = pgAirtable('group_switching', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblGCHwcMcDrl57OY',
  columns: {
    participant: {
      pgColumn: text(),
      airtableId: 'fldMb4VAcZUtgX8bw',
    },
    requestStatus: {
      pgColumn: text(),
      airtableId: 'flddokGe6ZjpmXXgu',
    },
    switchType: {
      pgColumn: text(),
      airtableId: 'fldmQas5lXJw7cIvS',
    },
    notesFromParticipant: {
      pgColumn: text(),
      airtableId: 'fldnLvbwwrFdzqGez',
    },
    oldGroup: {
      pgColumn: text(),
      airtableId: 'fld01AHEGhcNGqBx4',
    },
    newGroup: {
      pgColumn: text(),
      airtableId: 'fldl3oYgHUrigqv1s',
    },
    newDiscussion: {
      pgColumn: text().array(),
      airtableId: 'fldJBqQyf7b0zR6v0',
    },
    oldDiscussion: {
      pgColumn: text().array(),
      airtableId: 'fldqHnismQINb0lsw',
    },
    unit: {
      pgColumn: text(),
      airtableId: 'fldkBE6yK6PS84qKv',
    },
    manualRequest: {
      pgColumn: boolean(),
      airtableId: 'fldiXRWPVR1sCH17y',
    },
  },
});

/**
 * A bucket defines a set of groups, where participants are allowed to switch between the
 * groups if requested. This is desirable to have e.g. one bucket for recent graduates, and
 * one for more experienced professionals within the same round of a course.
 */
// Note: This is actually a sync of the "Course registration" table
// from APPLICATIONS_BASE_ID, rather than the "User" table
export const meetPersonTable = pgAirtable('meet_person', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblBeMxAM1FAW06n4',
  columns: {
    name: {
      pgColumn: text(),
      airtableId: 'fldP4ejaYy137J5Md',
    },
    applicationsBaseRecordId: {
      pgColumn: text(),
      airtableId: 'fldoKAVy6QPWZmofb',
    },
    projectSubmission: {
      pgColumn: text().array(),
      airtableId: 'fldFjRSrXH8Z5sGaQ',
    },
    role: {
      pgColumn: text(),
      airtableId: 'fldcMg0UmqlneGerA',
    },
    humanOpinion: { // Used for group switching
      pgColumn: text(),
      airtableId: 'fldoLlp0mb3G1Cjrs',
    },
    round: {
      pgColumn: text(),
      airtableId: 'fld8KD3BUPbCHHHqE',
    },
    expectedDiscussionsParticipant: {
      pgColumn: text().array(),
      airtableId: 'fldPsZbe9s5jtkQRn',
    },
    expectedDiscussionsFacilitator: {
      pgColumn: text().array(),
      airtableId: 'fldYEbDu2kJwWrSdJ',
    },
    attendedDiscussions: {
      pgColumn: text().array(),
      airtableId: 'fldTEkxGZQxTqHhdX',
    },
    uniqueDiscussionAttendance: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldMVAZse1xe6ENWs',
    },
    groupsAsParticipant: {
      pgColumn: text().array(),
      airtableId: 'fldryDThWSl7SkkYB',
    },
    autoNumberId: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldRtqMTFX50uqLw5',
    },
    email: {
      pgColumn: text(),
      airtableId: 'fld9BqZjF67r9Ce6O',
    },
    numUnits: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld1ICMPmCd5y7B17',
    },
    /** URL to the course feedback form (includes prefill_ parameters for this specific user) */
    courseFeedbackForm: {
      pgColumn: text(),
      airtableId: 'fldCLOXf2tv3g46ea',
    },
    /** Linked records to Course feedback table. If non-empty, feedback has been submitted */
    courseFeedback: {
      pgColumn: text().array(),
      airtableId: 'fldD7uatp5h4szlzB',
    },
    hasSentInactiveEmail: {
      pgColumn: boolean(),
      airtableId: 'fldAJk2NNzh32zVnJ',
    },
    firstName: {
      pgColumn: text(),
      airtableId: 'fldyJ6QUIiw1kGOfc',
    },
    lastName: {
      pgColumn: text(),
      airtableId: 'fldaIGPvelun2YNc9',
    },
    /** Airtable formula "[*] Pay for facilitated discussions": Total payment for facilitating this course (one round, all discussions) */
    payForFacilitatedDiscussions: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldSaRaUdmezPh9gH',
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
    /**
     * Primary field in Airtable, called "Course - Round" there.
     * Constructed by formula, example: "AGI Strategy (2025 Aug W35) - Intensive"
     */
    title: {
      pgColumn: text(),
      airtableId: 'fldEBVjEF9l2IEyG7',
    },
    course: {
      pgColumn: text(),
      airtableId: 'fldvx7D6Uw0VxMPr0',
    },
    maxParticipantsPerGroup: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldoIzHNm8NzjAefW',
    },
    startDate: {
      pgColumn: text(),
      airtableId: 'fldmmbX7ZtwjPbfMK',
    },
    lastDiscussionDate: {
      pgColumn: text(),
      airtableId: 'fldlXsYFtqt96nuvk',
    },
  },
});

export const applicationsRoundTable = pgAirtable('applications_round', {
  baseId: APPLICATIONS_BASE_ID,
  tableId: 'tblt1XjyP5KPoVPfB',
  columns: {
    courseRoundIntensity: { // e.g., "AI Alignment (2024 Feb W08)" or  "AGI Strategy (2025 Dec W51) - Intensive", or "AGI Strategy (2026 Jan W02) - Part-time"
      pgColumn: text(),
      airtableId: 'fldvOk9j9FbDV5aLl',
    },
    applicationDeadline: {
      pgColumn: text(),
      airtableId: 'fldXrkZ6Vg8zDh1ZU',
    },
    firstDiscussionDate: {
      pgColumn: text(),
      airtableId: 'fldLQNa0te7r3GpBU',
    },
    lastDiscussionDate: {
      pgColumn: text(),
      airtableId: 'fldTHHKka0wYfLBIa',
    },
    courseId: {
      pgColumn: text(),
      airtableId: 'fldz8sTIZz3O0fJoi',
    },
    intensity: {
      pgColumn: text(),
      airtableId: 'fldONnpcLTSwwy1NJ',
    },
    // Equal to number of days or weeks in the course
    numberOfUnits: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldgu6vcBcT7KiIG7',
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

export const facilitatorDiscussionSwitchingTable = pgAirtable('facilitator_discussion_switching', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblYpyG4RjhlMTmSm',
  columns: {
    facilitator: {
      pgColumn: text(),
      airtableId: 'fld2b1RzEHEh6BgD0',
    },
    round: {
      pgColumn: text(),
      airtableId: 'fldA4ysQjCtLMEZjR',
    },
    group: {
      pgColumn: text(),
      airtableId: 'fldadGhShdoBgH8TD',
    },
    intensity: {
      pgColumn: text(),
      airtableId: 'fldJZcoeuE9TwntMJ',
    },
    facilitatorRequestedDatetime: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld3ITxndtB6ZZtN5',
    },
    createdAt: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldECp0oKixn3pFkm',
    },
    anythingElse: {
      pgColumn: text(),
      airtableId: 'fldjWbb2vvQkcQaOs',
    },
    switchType: {
      pgColumn: text(),
      airtableId: 'fldZK15BFH6C4FlKG',
    },
    discussion: {
      pgColumn: text(),
      airtableId: 'fld8rNtdlycJiiYqI',
    },
    status: {
      pgColumn: text(),
      airtableId: 'fldxn1fWLefkcySaA',
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
    isFeatured: {
      pgColumn: boolean(),
      airtableId: 'fldBboUp1a7defS83',
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
    publishedAt: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldI1yVd0G5eCvWiy',
    },
    category: {
      pgColumn: text(),
      airtableId: 'fldSJh6VeETvtPuDD',
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

export const testimonialTable = pgAirtable('testimonial', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tblrA0ZIg4t2t6sh5',
  columns: {
    name: {
      pgColumn: text(),
      airtableId: 'fld8QirNnmWrOxK28',
    },
    headshotAttachmentUrls: {
      pgColumn: text(),
      airtableId: 'flddgVxCSMALkqyUl',
    },
    jobTitle: {
      pgColumn: text(),
      airtableId: 'fldO9gXGV0zA7Z0fh',
    },
    profileUrl: {
      pgColumn: text(),
      airtableId: 'fldlchhyYHzKx1q4K',
    },
    displayOnCourseSlugs: {
      pgColumn: text().array(),
      airtableId: 'fld64ErNzQB8UFLso',
    },
    isPrioritised: {
      pgColumn: boolean(),
      airtableId: 'fldissRE8oeE1chZC',
    },
    testimonialText: {
      pgColumn: text(),
      airtableId: 'fldSBm8bIIR5JAaeo',
    },
  },
});

// Postgres table name is kept as 'grant' (not 'rapid_grant') because drizzle-kit's
// pushSchema cannot disambiguate a rename from a drop+create without interactive
// input, which hangs headless pg-sync-service (see drizzle-orm issue #4651).
// The TypeScript variable is named for semantic clarity; only the physical table
// name stays put. The Airtable source is still the new Rapid grants table.
export const rapidGrantTable = pgAirtable('grant', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tblSrknIDVIyNySWn',
  columns: {
    granteeName: {
      pgColumn: text(),
      airtableId: 'fldUlQHywCO4veSSt',
    },
    projectTitle: {
      pgColumn: text(),
      airtableId: 'fld2UrP0r95OYSkRT',
    },
    amountUsd: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld1WoF5PUZVqiQdN',
    },
    projectSummary: {
      pgColumn: text(),
      airtableId: 'fld45GOVLKJWWrbr1',
    },
    link: {
      pgColumn: text(),
      airtableId: 'fldAKj0OmnG43FRSp',
    },
  },
});

export const careerTransitionGrantTable = pgAirtable('career_transition_grant', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tbln76u7AsVnWAKZo',
  columns: {
    firstName: {
      pgColumn: text(),
      airtableId: 'flduZeVfCBVWhq0YM',
    },
    lastName: {
      pgColumn: text(),
      airtableId: 'fldKQXPr9ZiQq9DVT',
    },
    // Formula field that outputs a permanent (miniextension-hosted) URL for the Photo attachment.
    // Concatenates up to 5 URLs space-separated; consumers should take the first.
    imageUrl: {
      pgColumn: text(),
      airtableId: 'fldWPOiBQAYxUlA7V',
    },
  },
});
/** Operational table. Only amount + status synced; grantee identifying info stays in Airtable. */
export const careerTransitionGrantApplicationTable = pgAirtable('career_transition_grant_application', {
  baseId: CONTRACTOR_PAYMENTS_BASE_ID,
  tableId: 'tblTBVFKyJNlvhfA6',
  columns: {
    grantAmountUsd: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldkLVS7boXaC3sJT',
    },
    evaluationStatus: {
      pgColumn: text(),
      airtableId: 'fldL3RXC6Yuwyng78',
    },
  },
});
/** Operational table. Only amount + decision + createdAt synced; applicant identifying info stays in Airtable. */
export const rapidGrantApplicationTable = pgAirtable('rapid_grant_application', {
  baseId: CONTRACTOR_PAYMENTS_BASE_ID,
  tableId: 'tblS9NHgtwl7YaHiZ',
  columns: {
    grantedAmountUsd: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldVIMRImfNwFeZvr',
    },
    grantDecision: {
      pgColumn: text(),
      airtableId: 'fldplHyKcS4NY2Oce',
    },
    createdAt: {
      pgColumn: text(),
      airtableId: 'fldSEVGlsG4wcKk4k',
    },
  },
});

export const chunkTable = pgAirtable('chunk', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tblNeBgFeQ5Qmebfc',
  columns: {
    chunkId: {
      pgColumn: text().notNull(),
      airtableId: 'fldzijTU9OYrA2pPR',
    },
    unitId: {
      pgColumn: text().notNull(),
      airtableId: 'flddMzU52lvSPS88e',
    },
    chunkTitle: {
      pgColumn: text().notNull(),
      airtableId: 'fldsx5tA91DiSejw2',
    },
    chunkOrder: {
      pgColumn: text().notNull(),
      airtableId: 'fld20cLGpEqVoDADz',
    },
    chunkType: {
      pgColumn: text().notNull(),
      airtableId: 'fldEVAjbup2EIaQaj',
    },
    chunkContent: {
      pgColumn: text().notNull(),
      airtableId: 'fldiv4wuePLO9UtHr',
    },
    estimatedTime: {
      pgColumn: numeric({ mode: 'number' }).default(0),
      airtableId: 'fldvzUryETzU5Yn64',
    },
    chunkResources: {
      pgColumn: text().array(),
      airtableId: 'fld2Xz83QX0B9OWJ5',
    },
    chunkExercises: {
      pgColumn: text().array(),
      airtableId: 'fldOMBehcT5xIjHUO',
    },
    status: {
      pgColumn: text(),
      airtableId: 'fldO90wqKy5TM4XyN',
    },
    metaDescription: {
      pgColumn: text(),
      airtableId: 'fldYM0jNhGRNvYAYI',
    },
  },
});

export const unitTable = pgAirtable('unit', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tblsDKJ8VCyO619nk',
  columns: {
    chunks: {
      pgColumn: text().array(),
      airtableId: 'fld0TFVKXKf2rIDiT',
    },
    courseId: {
      pgColumn: text().notNull(),
      airtableId: 'fldLmQZ0ISTr7xQUE',
    },
    courseTitle: {
      pgColumn: text().notNull(),
      airtableId: 'fld4AYVyIcfnzfE3Z',
    },
    courseSlug: {
      pgColumn: text().notNull(),
      airtableId: 'fldr9I5YGRIia8xln',
    },
    path: {
      pgColumn: text().notNull(),
      airtableId: 'fldEY7ZHZtXrBL3nv',
    },
    title: {
      pgColumn: text().notNull(),
      airtableId: 'fldN9BV8GGUHFu9sz',
    },
    content: {
      pgColumn: text(),
      airtableId: 'fldF9hjDhZpLbBIUV',
    },
    duration: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldGdibgcMgRbnuvp',
    },
    unitNumber: {
      pgColumn: text().notNull(),
      airtableId: 'fldimS5GIqSKuyA9C',
    },
    courseUnit: {
      pgColumn: text(),
      airtableId: 'fld0ba6PYWqirsjnH',
    },
    description: {
      pgColumn: text().notNull(),
      airtableId: 'fldpJLWVPh0IXHfmm',
    },
    learningOutcomes: {
      pgColumn: text(),
      airtableId: 'fld9vAMgn0Fm7x6Xf',
    },
    unitPodcastUrl: {
      pgColumn: text(),
      airtableId: 'fldwByN7lbmcjc3Fj',
    },
    unitStatus: {
      pgColumn: text().notNull(),
      airtableId: 'fldFJbY40IjPXer1Q',
    },
    autoNumberId: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld1rl39p5fSOiFya',
    },
  },
  deprecatedColumns: {
    coursePath: {
      pgColumn: text(),
      airtableId: 'fldlCrg7Nv1TPTorZ',
      deprecated: true,
    },
  },
});

export const unitResourceTable = pgAirtable('unit_resource', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tblSicSC1u6Ifddrq',
  columns: {
    resourceName: {
      pgColumn: text(),
      airtableId: 'fldXFZQpHtS5EqHyh',
    },
    resourceLink: {
      pgColumn: text(),
      airtableId: 'fldWmLt7N06ezb66y',
    },
    resourceGuide: {
      pgColumn: text(),
      airtableId: 'fldkS15QbkPvTozhl',
    },
    authors: {
      pgColumn: text(),
      airtableId: 'flddVAAZ4PgYSSez9',
    },
    timeFocusOnMins: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldedM0u6YXfyNVMF',
    },
    coreFurtherMaybe: {
      pgColumn: text(),
      airtableId: 'fldLvfYwwn0BhMSv5',
    },
    readingOrder: {
      pgColumn: text(),
      airtableId: 'fldBfLUY8GkI88jJF',
    },
    unitId: {
      pgColumn: text(),
      airtableId: 'fldJX4h1sTNkacKru',
    },
    avgRating: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldOWWeymJQTwlfaY',
    },
    syncedAudioUrl: {
      pgColumn: text().default(''), // For future github issue #1148
      airtableId: 'fldIqUoLYILUmMgY0',
    },
    year: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldtl37ZOF2Qx4Ui8',
    },
    autoNumberId: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldUOh3MNUIf0vnYb',
    },
  },
});

export const exerciseTable = pgAirtable('exercise', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tbla7lc2MtSSbWVvS',
  columns: {
    answer: {
      pgColumn: text(),
      airtableId: 'fldFcZVVo8Wg4GSmA',
    },
    courseId: {
      pgColumn: text(),
      airtableId: 'fldxcJ5gCihs3iRyE',
    },
    exerciseNumber: {
      pgColumn: text(),
      airtableId: 'fldOoKVFSrToAicfT',
    },
    description: {
      pgColumn: text(),
      airtableId: 'fldsoGDZ4d8Us64f1',
    },
    options: {
      pgColumn: text(),
      airtableId: 'fld38NpFZT4BdhWO3',
    },
    title: {
      pgColumn: text(),
      airtableId: 'fldVlrg0E4bV2xAcs',
    },
    type: {
      pgColumn: text(),
      airtableId: 'fldGXsdS2o3EnjNg9',
    },
    unitId: {
      pgColumn: text(),
      airtableId: 'fld2KJRxb50MbtrJc',
    },
    status: {
      pgColumn: text(),
      airtableId: 'flda5e542i9w1nBzv',
    },
  },
  deprecatedColumns: {
    unitNumber: {
      pgColumn: text(),
      airtableId: 'fldL42M2hgchJYIdD',
      deprecated: true,
    },
    courseIdWrite: {
      pgColumn: text(),
      airtableId: 'fldxcJ5gCihs3iRyE',
      deprecated: true,
    },
    courseIdRead: {
      pgColumn: text(),
      airtableId: 'fldc9oyPwJSkeMiAW',
      deprecated: true,
    },
  },
});

export const applicationsCourseTable = pgAirtable('applications_course', {
  baseId: APPLICATIONS_BASE_ID,
  tableId: 'tblc3Yvrco2AZEBlx',
  columns: {
    courseBuilderId: {
      pgColumn: text(),
      airtableId: 'fld9QUbMmJF2vtRCK',
    },
  },
});

export const courseRegistrationTable = pgAirtable('course_registration', {
  baseId: APPLICATIONS_BASE_ID,
  tableId: 'tblXKnWoXK3R63F6D',
  columns: {
    userId: {
      pgColumn: text(),
      airtableId: 'fldyVcp78eIfqmai3',
    },
    email: {
      pgColumn: text().notNull(),
      airtableId: 'fld0g392xytratknm',
    },
    firstName: {
      pgColumn: text(),
      airtableId: 'fldIhZ4wc5t1Yabgz',
    },
    lastName: {
      pgColumn: text(),
      airtableId: 'fldHa6GR5aBsOBtkz',
    },
    fullName: {
      pgColumn: text(),
      airtableId: 'fld1rOZGAHBRcdJcM',
    },
    courseApplicationsBaseId: {
      pgColumn: text(),
      airtableId: 'fldPkqPbeoIhERqSY',
    },
    // Note: This is the id of the course in the COURSE_BUILDER base and not in the APPLICATIONS base
    courseId: {
      pgColumn: text().notNull(),
      airtableId: 'fldFTXtevzOc29Qte',
    },
    decision: {
      pgColumn: text(),
      airtableId: 'fldWVKY5EFAGSRcDT',
    },
    role: {
      pgColumn: text(),
      airtableId: 'fld52Y2AyWV8tECDy',
    },
    certificateId: {
      pgColumn: text(),
      airtableId: 'fld9hQE0EvdKRsp9k',
    },
    certificateCreatedAt: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldQJyVjaiQzsVGD9',
    },
    roundStatus: {
      pgColumn: text(),
      airtableId: 'fldz7YSh2vRutPCyg',
    },
    autoNumberId: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld2W2olE7mRRALMC',
    },
    // Note: This is intended to be the `utm_source` for the session they registered in, not the source
    // given by the user (this is a separate field called '[a] Source' in Airtable)
    source: {
      pgColumn: text(),
      airtableId: 'fldQ9PM3ejhilPFc6',
    },
    // Format: weekly-availabilities library format (https://github.com/domdomegg/weekly-availabilities)
    // Days: M=Mon, T=Tue, W=Wed, R=Thu, F=Fri, S=Sat, U=Sun
    // Example: "M16:00 M18:00, W20:00 R08:00" = Monday 4-6pm UTC, Wednesday 8pm to Thursday 8am UTC
    availabilityIntervalsUTC: {
      pgColumn: text(),
      airtableId: 'fldFpLDHyPPDvnJYg',
    },
    availabilityComments: {
      pgColumn: text(),
      airtableId: 'fldur7dw7JEiAQNFK',
    },
    // Format: "UTC[+/-]HH:MM", e.g. "UTC+01:00", "UTC-05:00", "UTC00:00"
    availabilityTimezone: {
      pgColumn: text(),
      airtableId: 'fld9Y4WfeafUNMxMH',
    },
    /**
     * Formula field that returns the round name.
     * Example: "AGI Strategy (2025 Aug W35) - Intensive"
     */
    roundName: {
      pgColumn: text(),
      airtableId: 'fldQymBa7milTYP9q',
    },
    roundId: {
      pgColumn: text(),
      airtableId: 'fldYaHSLqnvBXyjur',
    },
    isDuplicate: {
      pgColumn: boolean(),
      airtableId: 'fld1KQjHFGoDZKf94',
    },
    // Join to 'dropout' table if the user has dropped out or deferred from a course
    dropoutId: {
      pgColumn: text().array(),
      airtableId: 'fldaEk9K3m25Hs4Ga',
    },
    deferredId: {
      pgColumn: text().array(),
      airtableId: 'fldc7bNIkEyrMsQ4w',
    },
  },
  deprecatedColumns: {
    lastVisitedUnitNumber: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldTz0302G1aNX9uP',
      deprecated: true,
    },
    lastVisitedChunkIndex: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldqBkQC2fZLtPEZX',
      deprecated: true,
    },
  },
});

export const userTable = pgAirtable('user', {
  baseId: APPLICATIONS_BASE_ID,
  tableId: 'tblCgeKADNDSCXPpR',
  columns: {
    email: {
      pgColumn: text().notNull(),
      airtableId: 'fldLAGRfn7S6uEVRo',
    },
    createdAt: {
      pgColumn: text(),
      airtableId: 'fld2AGYp0VLOz3Pg6',
    },
    lastSeenAt: {
      pgColumn: text(),
      airtableId: 'fldOFCUM6lD5Mne9Y',
    },
    name: {
      pgColumn: text().notNull(),
      airtableId: 'fldULI4CXDWAUmRM2',
    },
    utmSource: {
      pgColumn: text(),
      airtableId: 'fldl1gTMXI44BvCUS',
    },
    utmCampaign: {
      pgColumn: text(),
      airtableId: 'fldcNcqMxSFpmiGWT',
    },
    utmContent: {
      pgColumn: text(),
      airtableId: 'fldlpjcdh7jpZhHhv',
    },
    autoNumberId: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld93rcijT2GzMtFS',
    },
    isAdmin: {
      pgColumn: boolean(),
      airtableId: 'fldtx4adP1XOOpg5e',
    },
    allowedImpersonationTargets: {
      pgColumn: text().array(),
      airtableId: 'fldsMtibz4pDg0ztQ',
    },
  },
});

// Resource feedback constants for better readability
export const RESOURCE_FEEDBACK = {
  DISLIKE: -1,
  NO_RESPONSE: 0,
  LIKE: 1,
} as const;

// Type for resourceFeedback field values
export type ResourceFeedbackValue = typeof RESOURCE_FEEDBACK[keyof typeof RESOURCE_FEEDBACK];

export const resourceCompletionTable = pgAirtable('resource_completion', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tblu6YnR7Lh0Bsl6v',
  columns: {
    unitResourceId: {
      pgColumn: text(),
      airtableId: 'fldk4dbWAohE312Qn',
    },
    isCompleted: {
      pgColumn: boolean(),
      airtableId: 'fldm74UNAQuC1XkQc',
    },
    email: {
      pgColumn: text(),
      airtableId: 'fldXqD5YKVZuTGT35',
    },
    feedback: {
      pgColumn: text(),
      airtableId: 'fld68CYhCZ44jHT21',
    },
    resourceFeedback: {
      pgColumn: numeric({ mode: 'number' }).$type<ResourceFeedbackValue>().default(RESOURCE_FEEDBACK.NO_RESPONSE),
      airtableId: 'flda3JolMPL5n8iUT',
    },
    autoNumberId: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldbT2G8lDkUsuusY',
    },
  },
  deprecatedColumns: {
    rating: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldq6J5taZX4xLDfD',
      deprecated: true,
    },
  },
});

export const teamMemberTable = pgAirtable('team_member', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tblt4A2LhdyhAcBk9',
  columns: {
    name: { pgColumn: text(), airtableId: 'fldjY13g0tuTPJmB3' },
    jobTitle: { pgColumn: text(), airtableId: 'fldlJy9D63sCry5Yg' },
    imageAttachmentUrls: { pgColumn: text(), airtableId: 'fldOo7XlA4hA1glaL' },
    imagePublicUrls: { pgColumn: text(), airtableId: 'fldmN54i5qJObcwuN' },
    url: { pgColumn: text(), airtableId: 'fld3ChLLOQHQGDK18' },
    status: { pgColumn: text(), airtableId: 'fld5nsgLdaDUoMC2N' },
  },
});

export const dropoutTable = pgAirtable('dropout', {
  baseId: APPLICATIONS_BASE_ID,
  tableId: 'tblmxqYXX1RaDvunu',
  columns: {
    applicantId: {
      pgColumn: text().array(),
      airtableId: 'fldPd4tLm0m3EsuQc',
    },
    reason: {
      pgColumn: text(),
      airtableId: 'fld46PnSM2D9naqtK',
    },
    isDeferral: {
      pgColumn: boolean(),
      airtableId: 'fldzYMTGkTd91Chyu',
    },
  },
});

export const bugReportsTable = pgAirtable('bug_reports', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tblbwt3oGJfwHmIAc',
  columns: {
    description: {
      pgColumn: text(),
      airtableId: 'fldim1KqWIMql3SOe',
    },
    attachments: {
      pgColumn: text().array(),
      airtableId: 'fldwb2IJjBIpE4fJi',
    },
    recordingUrl: {
      pgColumn: text(),
      airtableId: 'fldSd9pPXP44Sho8G',
    },
    email: {
      pgColumn: text(),
      airtableId: 'fldxRuw7bssFXUDzv',
    },
    createdAt: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldkUleb2Z7Jb92fu',
    },
  },
});

// Course feedback tables
export const courseFeedbackTable = pgAirtable('course_feedback', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblRFqRF2tKAqh7sp',
  columns: {
    person: {
      pgColumn: text().array(),
      airtableId: 'fldG4l1tLMXcvoLXB',
    },
    round: {
      pgColumn: text().array(),
      airtableId: 'fldUrmIIPpfew5KIL',
    },
    courseRating: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld90CnlNH6osIEhm',
    },
    courseValue: {
      pgColumn: text(),
      airtableId: 'fldhPd7BmdhlG2QKl',
    },
    improvements: {
      pgColumn: text(),
      airtableId: 'fldi82s0kEUrkhsaM',
    },
    completed: {
      pgColumn: boolean(),
      airtableId: 'fldwjYVkgTT8407U0',
    },
    personFeedback: {
      pgColumn: text().array(),
      airtableId: 'fldf1vkZDkPDpWdRX',
    },
    submittedAt: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldU1lnBjth2Fxban',
    },
  },
});

export const peerFeedbackTable = pgAirtable('peer_feedback', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tbl8KC4Q1i5YlCGhm',
  columns: {
    courseFeedback: {
      pgColumn: text().array(),
      airtableId: 'fldbxDhfPqnvyFmmf',
    },
    feedbackRecipient: {
      pgColumn: text().array(),
      airtableId: 'fldnHEXJ0HMDJgiEM',
    },
    reasoningQualityRating: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldNXTpmIxyKvYdZH',
    },
    initiativeRating: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldUBSY6rZ1Oyf1bd',
    },
    feedback: {
      pgColumn: text(),
      airtableId: 'fldybGPKyRUcM0D84',
    },
    nextSteps: {
      pgColumn: text().array(),
      airtableId: 'fldDXBWnFLi7vD2CQ',
    },
  },
});

// Type exports for all tables
export type Meta = InferSelectModel<typeof metaTable>;
export type SyncMetadata = InferSelectModel<typeof syncMetadataTable>;
export type SyncRequest = InferSelectModel<typeof syncRequestsTable>;
export type Course = InferSelectModel<typeof courseTable.pg>;
export type ExerciseResponse = InferSelectModel<typeof exerciseResponseTable.pg>;
export type FormConfiguration = InferSelectModel<typeof formConfigurationTable.pg>;
export type Person = InferSelectModel<typeof personTable.pg>;
export type SharedDemoOutput = InferSelectModel<typeof sharedDemoOutputTable.pg>;
export type Group = InferSelectModel<typeof groupTable.pg>;
export type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
export type GroupSwitching = InferSelectModel<typeof groupSwitchingTable.pg>;
export type MeetPerson = InferSelectModel<typeof meetPersonTable.pg>;
export type ZoomAccount = InferSelectModel<typeof zoomAccountTable.pg>;
export type Round = InferSelectModel<typeof roundTable.pg>;
export type ApplicationsRound = InferSelectModel<typeof applicationsRoundTable.pg>;
export type MeetCourse = InferSelectModel<typeof meetCourseTable.pg>;
export type Blog = InferSelectModel<typeof blogTable.pg>;
export type JobPosting = InferSelectModel<typeof jobPostingTable.pg>;
export type Project = InferSelectModel<typeof projectTable.pg>;
export type Testimonial = InferSelectModel<typeof testimonialTable.pg>;
export type RapidGrant = InferSelectModel<typeof rapidGrantTable.pg>;
export type CareerTransitionGrant = InferSelectModel<typeof careerTransitionGrantTable.pg>;
export type CareerTransitionGrantApplication = InferSelectModel<typeof careerTransitionGrantApplicationTable.pg>;
export type RapidGrantApplication = InferSelectModel<typeof rapidGrantApplicationTable.pg>;
export type Chunk = InferSelectModel<typeof chunkTable.pg>;
export type Unit = InferSelectModel<typeof unitTable.pg>;
export type UnitResource = InferSelectModel<typeof unitResourceTable.pg>;
export type Exercise = InferSelectModel<typeof exerciseTable.pg>;
export type ApplicationsCourse = InferSelectModel<typeof applicationsCourseTable.pg>;
export type CourseRegistration = InferSelectModel<typeof courseRegistrationTable.pg>;
export type User = InferSelectModel<typeof userTable.pg>;
export type ResourceCompletion = InferSelectModel<typeof resourceCompletionTable.pg>;
export type FacilitatorSwitching = InferSelectModel<typeof facilitatorDiscussionSwitchingTable.pg>;
export type Dropout = InferSelectModel<typeof dropoutTable.pg>;
export type TeamMember = InferSelectModel<typeof teamMemberTable.pg>;
export type BugReport = InferSelectModel<typeof bugReportsTable.pg>;
export type CourseFeedback = InferSelectModel<typeof courseFeedbackTable.pg>;
export type PeerFeedback = InferSelectModel<typeof peerFeedbackTable.pg>;
