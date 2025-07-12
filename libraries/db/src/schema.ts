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
      airtableId: 'fldblKROooVG5p9UW',
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
    groupDiscussions: {
      pgColumn: text().array().notNull(),
      airtableId: 'fldwEeC65sHvGGRGb',
    },
    round: {
      pgColumn: text().notNull(),
      airtableId: 'fldtzy3nSP0piVApO',
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
  },
});

export const meetPersonTable = pgAirtable('meet_person', {
  baseId: COURSE_RUNNER_BASE_ID,
  tableId: 'tblBeMxAM1FAW06n4',
  columns: {
    name: {
      pgColumn: text().notNull(),
      airtableId: 'fldP4ejaYy137J5Md',
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
    referralId: {
      pgColumn: text().notNull(),
      airtableId: 'fldTT0LY0pZsOwQ4w',
    },
    referredById: {
      pgColumn: text(),
      airtableId: 'flditAk6CtQxCfHf8',
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
  },
});
