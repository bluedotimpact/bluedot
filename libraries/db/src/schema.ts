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
    certificationDescription: {
      pgColumn: text(),
      airtableId: 'fldsxyHg4BLouu7XZ',
    },
    description: {
      pgColumn: text().notNull(),
      airtableId: 'fldCX0bk6SQuXZaI7',
    },
    detailsUrl: {
      pgColumn: text().notNull(),
      airtableId: 'fldlnWDzZZPZHP6S1',
    },
    displayOnCourseHubIndex: {
      pgColumn: boolean().notNull(),
      airtableId: 'fldf7ppu9kN4blXU9',
    },
    durationDescription: {
      pgColumn: text().notNull(),
      airtableId: 'fldHxekJ6BioQMF3e',
    },
    durationHours: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld77qMwZ1de2owvx',
    },
    image: {
      pgColumn: text(),
      airtableId: 'fldh90A6x8HwQSkMy',
    },
    slug: {
      pgColumn: text().notNull(),
      airtableId: 'fldHWXKaVuHJAaMbP',
    },
    path: {
      pgColumn: text().notNull(),
      airtableId: 'fldEjx0ZP8SNYcNQR',
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
    cadence: {
      pgColumn: text().notNull(),
      airtableId: 'fldTI1NI7ocFIWcmv',
    },
    level: {
      pgColumn: text().notNull(),
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
      pgColumn: boolean().notNull(),
      airtableId: 'fldFFndUplP3mEFe7',
    },
    isFeatured: {
      pgColumn: boolean().notNull(),
      airtableId: 'fldDXwQyHpHtUspFY',
    },
    status: {
      pgColumn: text(),
      airtableId: 'fldaEypOAkLCFfYBQ',
    },
  },
});

export const unitFeedbackTable = pgAirtable('unit_feedback', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tblBwjMjul1c6l7ea',
  columns: {
    unitId: {
      pgColumn: text().notNull(),
      airtableId: 'fldYqvWII6kuxCCmH',
    },
    overallRating: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fld3B8HUudN5NxPIU',
    },
    anythingElse: {
      pgColumn: text().notNull(),
      airtableId: 'fldYdcPZPdJAqn06w',
    },
    userEmail: {
      pgColumn: text().notNull(),
      airtableId: 'fld9JsHJXjud5Bhle',
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
    completed: {
      pgColumn: boolean().notNull(),
      airtableId: 'fldz8rocQd7Ws9s2q',
    },
  },
});

export const formConfigurationTable = pgAirtable('form_configuration', {
  baseId: AVAILABILITY_FORMS_BASE_ID,
  tableId: 'tblvsaRl69XV8azGZ',
  columns: {
    slug: {
      pgColumn: text().notNull(),
      airtableId: 'fldrw0oSjFSMezFJ2',
    },
    title: {
      pgColumn: text().notNull(),
      airtableId: 'fldHiGrJmyBvSdGUm',
    },
    webhook: {
      pgColumn: text().notNull(),
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
      pgColumn: text().notNull(),
      airtableId: 'fldJzIWg2HMBmwPjZ',
    },
    firstName: {
      pgColumn: text().notNull(),
      airtableId: 'fldxyoC98EoVQDrqa',
    },
    lastName: {
      pgColumn: text().notNull(),
      airtableId: 'fldrfvKXru0YEXLvh',
    },
    ethnicGroup: {
      pgColumn: text().notNull(),
      airtableId: 'fldaLQ2MnUVa9tdRf',
    },
    careerPlans: {
      pgColumn: text().notNull(),
      airtableId: 'fldqq4LyZ5pf26NsN',
    },
    biography: {
      pgColumn: text().notNull(),
      airtableId: 'fldg9GSGb1dY59kf4',
    },
    appliedToOpportunities: {
      pgColumn: text().array(),
      airtableId: 'fldhI1cqdvrXwbJb7',
    },
    isProfilePublic: {
      pgColumn: boolean().notNull(),
      airtableId: 'fldNW3O0U3vCBk0Nf',
    },
  },
});

export const sharedDemoOutputTable = pgAirtable('shared_demo_output', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tbl9WE3N4B0OjocEB',
  columns: {
    type: {
      pgColumn: text().notNull(),
      airtableId: 'fldpAHTnZOJc8wbFV',
    },
    data: {
      pgColumn: text().notNull(),
      airtableId: 'fldsh10gNDXfkosfJ',
    },
    createdAt: {
      pgColumn: numeric({ mode: 'number' }).notNull(),
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
      pgColumn: text().array().notNull(),
      airtableId: 'fldwEeC65sHvGGRGb',
    },
    round: {
      pgColumn: text().notNull(),
      airtableId: 'fldtzy3nSP0piVApO',
    },
    participants: {
      pgColumn: text().array().notNull(),
      airtableId: 'fldcEa25oCDAmgDqm',
    },
    whoCanSwitchIntoThisGroup: {
      pgColumn: text().array().notNull(),
      airtableId: 'fldVQihgKyx6nJIR5',
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
      pgColumn: text().array().notNull(),
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
      pgColumn: text().notNull(),
      airtableId: 'flddokGe6ZjpmXXgu',
    },
    switchType: {
      pgColumn: text().notNull(),
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
      pgColumn: text().array().notNull(),
      airtableId: 'fldJBqQyf7b0zR6v0',
    },
    oldDiscussion: {
      pgColumn: text().array().notNull(),
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

export const courseRunnerBucketTable = pgAirtable('course_runner_bucket', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tbl7Pevw79fDA7EmX',
  columns: {
    groups: {
      pgColumn: text().array().notNull(),
      airtableId: 'flduxhuBAiLVdfolQ',
    },
    round: {
      pgColumn: text(),
      airtableId: 'fld0afnDgsNXYim7V',
    },
  },
});

// Note: This is actually a sync of the "Course registration" table
// from APPLICATIONS_BASE_ID, rather than the "User" table
export const meetPersonTable = pgAirtable('meet_person', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblBeMxAM1FAW06n4',
  columns: {
    name: {
      pgColumn: text().notNull(),
      airtableId: 'fldP4ejaYy137J5Md',
    },
    applicationsBaseRecordId: {
      pgColumn: text(),
      airtableId: 'fldoKAVy6QPWZmofb',
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
  },
});

export const zoomAccountTable = pgAirtable('zoom_account', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblF61F1xXUnpB13S',
  columns: {
    meetingLink: {
      pgColumn: text().notNull(),
      airtableId: 'fldF5V0uf7jYAxHu5',
    },
    hostKey: {
      pgColumn: text().notNull(),
      airtableId: 'fldprdNVzdeAU1cRH',
    },
  },
});

export const roundTable = pgAirtable('round', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblu6u7F2NHfCMgsk',
  columns: {
    course: {
      pgColumn: text().notNull(),
      airtableId: 'fldvx7D6Uw0VxMPr0',
    },
    maxParticipantsPerGroup: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldoIzHNm8NzjAefW',
    },
  },
});

export const meetCourseTable = pgAirtable('meet_course', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblO0sgD3ioedaqDw',
  columns: {
    courseSite: {
      pgColumn: text().notNull(),
      airtableId: 'fldzJ2h89blzv6MSb',
    },
  },
});

export const blogTable = pgAirtable('blog', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tblT8jgeG4QWX2Fj4',
  columns: {
    title: {
      pgColumn: text().notNull(),
      airtableId: 'fldB4uHuTqUd4JOsw',
    },
    slug: {
      pgColumn: text().notNull(),
      airtableId: 'fldSy5THCV7WOtYiN',
    },
    body: {
      pgColumn: text().notNull(),
      airtableId: 'fldesLVb1tJpsNkVl',
    },
    authorName: {
      pgColumn: text().notNull(),
      airtableId: 'fldBVD1meb54zRK8Q',
    },
    authorUrl: {
      pgColumn: text(),
      airtableId: 'fldEOlPQdbEmDxicJ',
    },
    publishedAt: {
      pgColumn: numeric({ mode: 'number' }).notNull(),
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
      pgColumn: text().notNull(),
      airtableId: 'fldN51J9NLxyRBEDf',
    },
    subtitle: {
      pgColumn: text().notNull(),
      airtableId: 'fldhiAectnNMEmUt5',
    },
    slug: {
      pgColumn: text().notNull(),
      airtableId: 'fldiMgiy9wHuvIM2f',
    },
    applicationUrl: {
      pgColumn: text(),
      airtableId: 'fldtkliaGs8JLy0BS',
    },
    body: {
      pgColumn: text().notNull(),
      airtableId: 'fldiBF58TPRIMhgvq',
    },
    publicationStatus: {
      pgColumn: text(),
      airtableId: 'fld4cZjg7YiEDaZXg',
    },
    publishedAt: {
      pgColumn: numeric({ mode: 'number' }).notNull(),
      airtableId: 'fldI1yVd0G5eCvWiy',
    },
  },
});

export const projectTable = pgAirtable('project', {
  baseId: WEB_CONTENT_BASE_ID,
  tableId: 'tblYCFWqPy29YIWe6',
  columns: {
    title: {
      pgColumn: text().notNull(),
      airtableId: 'fldGyQnG2U6q5p5ny',
    },
    slug: {
      pgColumn: text().notNull(),
      airtableId: 'fldX2rzTLpj9P9fdP',
    },
    body: {
      pgColumn: text().notNull(),
      airtableId: 'fldjW7BnaXVCttBQn',
    },
    authorName: {
      pgColumn: text().notNull(),
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
      pgColumn: numeric({ mode: 'number' }).notNull(),
      airtableId: 'fldoTpdgfEBNQgej9',
    },
    publicationStatus: {
      pgColumn: text().notNull(),
      airtableId: 'fldn7RrnTe80QUEt6',
    },
    course: {
      pgColumn: text().notNull(),
      airtableId: 'fldNHNMuxmQjaokmY',
    },
    tag: {
      pgColumn: text().array().notNull(),
      airtableId: 'fldeTqWZOvybdopnK',
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
    coursePath: {
      pgColumn: text().notNull(),
      airtableId: 'fldlCrg7Nv1TPTorZ',
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
    menuText: {
      pgColumn: text(),
      airtableId: 'flddCXEeJ9oFOhfNb',
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
  },
});

export const unitResourceTable = pgAirtable('unit_resource', {
  baseId: COURSE_BUILDER_BASE_ID,
  tableId: 'tblSicSC1u6Ifddrq',
  columns: {
    resourceName: {
      pgColumn: text().notNull(),
      airtableId: 'fldXFZQpHtS5EqHyh',
    },
    resourceType: {
      pgColumn: text(),
      airtableId: 'fldftDf7tejin3F7U',
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
      pgColumn: text().notNull(),
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
    courseIdWrite: {
      pgColumn: text().notNull(),
      airtableId: 'fldxcJ5gCihs3iRyE',
    },
    courseIdRead: {
      pgColumn: text().notNull(),
      airtableId: 'fldc9oyPwJSkeMiAW',
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
      pgColumn: text().notNull(),
      airtableId: 'fldGXsdS2o3EnjNg9',
    },
    unitId: {
      pgColumn: text().notNull(),
      airtableId: 'fld2KJRxb50MbtrJc',
    },
    unitNumber: {
      pgColumn: text(),
      airtableId: 'fldL42M2hgchJYIdD',
    },
    status: {
      pgColumn: text(),
      airtableId: 'flda5e542i9w1nBzv',
    },
  },
});

export const applicationsCourseTable = pgAirtable('applications_course', {
  baseId: APPLICATIONS_BASE_ID,
  tableId: 'tblc3Yvrco2AZEBlx',
  columns: {
    courseBuilderId: {
      pgColumn: text().notNull(),
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
      pgColumn: text().notNull(),
      airtableId: 'fldIhZ4wc5t1Yabgz',
    },
    lastName: {
      pgColumn: text().notNull(),
      airtableId: 'fldHa6GR5aBsOBtkz',
    },
    fullName: {
      pgColumn: text().notNull(),
      airtableId: 'fld1rOZGAHBRcdJcM',
    },
    courseApplicationsBaseId: {
      pgColumn: text(),
      airtableId: 'fldPkqPbeoIhERqSY',
    },
    // Note: This is the id of the course in the COURSE_BUILDER base, not in the APPLICATIONS base
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
    lastVisitedUnitNumber: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldTz0302G1aNX9uP',
    },
    lastVisitedChunkIndex: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldqBkQC2fZLtPEZX',
    },
    roundStatus: {
      pgColumn: text(),
      airtableId: 'fldz7YSh2vRutPCyg',
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
    unitResourceIdWrite: {
      pgColumn: text().notNull(),
      airtableId: 'fldk4dbWAohE312Qn',
    },
    unitResourceIdRead: {
      pgColumn: text().notNull(),
      airtableId: 'fldoTb7xx0QQVHXvM',
    },
    rating: {
      pgColumn: numeric({ mode: 'number' }),
      airtableId: 'fldq6J5taZX4xLDfD',
    },
    isCompleted: {
      pgColumn: boolean().notNull(),
      airtableId: 'fldm74UNAQuC1XkQc',
    },
    email: {
      pgColumn: text().notNull(),
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
  },
});
