import { Item, Table } from 'airtable-ts';

export type Chunk = {
  chunkId: string,
  unitId: string,
  chunkTitle: string,
  chunkOrder: string,
  chunkType: string,
  chunkContent: string,
} & Item;

export const chunkTable: Table<Chunk> = {
  name: 'Chunk',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tblNeBgFeQ5Qmebfc',
  mappings: {
    chunkId: 'fldzijTU9OYrA2pPR',
    unitId: 'flddMzU52lvSPS88e',
    chunkTitle: 'fldsx5tA91DiSejw2',
    chunkOrder: 'fld20cLGpEqVoDADz',
    chunkType: 'fldEVAjbup2EIaQaj',
    chunkContent: 'fldiv4wuePLO9UtHr',
  },
  schema: {
    chunkId: 'string',
    unitId: 'string',
    chunkTitle: 'string',
    chunkOrder: 'string',
    chunkType: 'string',
    chunkContent: 'string',
  },
};

export type Course = {
  certificationBadgeImage: string,
  certificatonDescription: string,
  description: string,
  detailsUrl: string,
  displayOnCourseHubIndex: boolean,
  durationDescription: string,
  durationHours: number | null,
  id: string,
  image: string,
  slug: string,
  path: string,
  shortDescription: string,
  title: string,
  units: string[],
  cadence: string,
  level: string,
  averageRating: number | null,
  publicLastUpdated: string | null,
  // numGraduates: number, // TODO
} & Item;

export const courseTable: Table<Course> = {
  name: 'Course',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tbl6nq5AVLKINBJ73',
  mappings: {
    certificationBadgeImage: 'fldwOxukk9OyUPWDX',
    certificatonDescription: 'fldsxyHg4BLouu7XZ',
    description: 'fldCX0bk6SQuXZaI7',
    detailsUrl: 'fldblKROooVG5p9UW',
    displayOnCourseHubIndex: 'fldf7ppu9kN4blXU9',
    durationDescription: 'fldHxekJ6BioQMF3e',
    durationHours: 'fld77qMwZ1de2owvx',
    image: 'fldh90A6x8HwQSkMy',
    slug: 'fldHWXKaVuHJAaMbP',
    path: 'fldEjx0ZP8SNYcNQR',
    shortDescription: 'fld0KVXjcZkSpBOIT',
    title: 'fldUyKGqFb7OiY0KF',
    units: 'fldxi3h4LD2Bs3efO',
    cadence: 'fldTI1NI7ocFIWcmv',
    level: 'fldkL7aWITGCPqzxc',
    averageRating: 'fldONpnyJ4OG0StDY',
    publicLastUpdated: 'fld8g5mMsPqOm75Vz',
    // numGraduates: '', // TODO
  },
  schema: {
    certificationBadgeImage: 'string',
    certificatonDescription: 'string',
    description: 'string',
    detailsUrl: 'string',
    displayOnCourseHubIndex: 'boolean',
    durationDescription: 'string',
    durationHours: 'number | null',
    image: 'string',
    slug: 'string',
    path: 'string',
    shortDescription: 'string',
    title: 'string',
    units: 'string[]',
    cadence: 'string',
    level: 'string',
    averageRating: 'number | null',
    publicLastUpdated: 'string | null',
    // numGraduates: 'number', // TODO
  },
};

export type ApplicationsCourse = {
  id: string, // Applications base record id
  courseBuilderId: string,
} & Item;

export const applicationsCourseTable: Table<ApplicationsCourse> = {
  name: 'Course',
  baseId: 'appnJbsG1eWbAdEvf',
  tableId: 'tblc3Yvrco2AZEBlx',
  mappings: {
    courseBuilderId: 'fld9QUbMmJF2vtRCK',
  },
  schema: {
    courseBuilderId: 'string',
  },
};

export type UnitFeedback = {
  unitId: string,
  overallRating: number,
  anythingElse: string,
  userEmail: string,
  userFullName: string,
  createdAt: string | null,
  lastModified: string | null,
} & Item;

export const unitFeedbackTable: Table<UnitFeedback> = {
  name: 'UnitFeedback',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tblBwjMjul1c6l7ea',
  mappings: {
    unitId: 'fldYqvWII6kuxCCmH',
    overallRating: 'fld3B8HUudN5NxPIU',
    anythingElse: 'fldYdcPZPdJAqn06w',
    userEmail: 'fld9JsHJXjud5Bhle',
    userFullName: 'fldPG0z0SRFcGJhNW',
    createdAt: 'fldWyJJz3OVNK0kTn',
    lastModified: 'fldCQ0O6oOf4BcMpJ',
  },
  schema: {
    unitId: 'string',
    overallRating: 'number',
    anythingElse: 'string',
    userEmail: 'string',
    userFullName: 'string',
    createdAt: 'string | null',
    lastModified: 'string | null',
  },
};

export type Unit = {
  id: string,
  chunks: string[] | null,
  courseId: string,
  courseTitle: string,
  coursePath: string,
  courseSlug: string,
  path: string,
  title: string,
  content: string,
  unitNumber: string,
  duration: number,
  menuText: string,
  description: string,
  learningOutcomes: string,
  unitPodcastUrl: string,
} & Item;

export const unitTable: Table<Unit> = {
  name: 'Unit',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tblsDKJ8VCyO619nk',
  mappings: {
    chunks: 'fld0TFVKXKf2rIDiT',
    courseId: 'fldLmQZ0ISTr7xQUE',
    courseTitle: 'fld4AYVyIcfnzfE3Z',
    coursePath: 'fldlCrg7Nv1TPTorZ',
    courseSlug: 'fldr9I5YGRIia8xln',
    path: 'fldEY7ZHZtXrBL3nv',
    title: 'fldN9BV8GGUHFu9sz',
    content: 'fldF9hjDhZpLbBIUV',
    duration: 'fldGdibgcMgRbnuvp',
    unitNumber: 'fldimS5GIqSKuyA9C',
    menuText: 'flddCXEeJ9oFOhfNb',
    description: 'fldpJLWVPh0IXHfmm',
    learningOutcomes: 'fld9vAMgn0Fm7x6Xf',
    unitPodcastUrl: 'fldwByN7lbmcjc3Fj',
  },
  schema: {
    chunks: 'string[] | null',
    courseId: 'string',
    courseTitle: 'string',
    coursePath: 'string',
    courseSlug: 'string',
    path: 'string',
    title: 'string',
    content: 'string',
    duration: 'number',
    unitNumber: 'string',
    menuText: 'string',
    description: 'string',
    learningOutcomes: 'string',
    unitPodcastUrl: 'string',
  },
};

export type UnitResource = {
  id: string,
  resourceName: string,
  resourceType: string,
  resourceLink: string | null,
  resourceGuide: string,
  authors: string | null,
  timeFocusOnMins: number | null,
  coreFurtherMaybe: string,
  readingOrder: string,
  unitId: string,
  avgRating: number | null,
} & Item;

export const unitResourceTable: Table<UnitResource> = {
  name: 'Unit resource',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tblSicSC1u6Ifddrq',
  mappings: {
    resourceName: 'fldXFZQpHtS5EqHyh',
    resourceType: 'fldftDf7tejin3F7U',
    resourceLink: 'fldWmLt7N06ezb66y',
    resourceGuide: 'fldkS15QbkPvTozhl',
    authors: 'flddVAAZ4PgYSSez9',
    timeFocusOnMins: 'fldedM0u6YXfyNVMF',
    coreFurtherMaybe: 'fldLvfYwwn0BhMSv5',
    readingOrder: 'fldBfLUY8GkI88jJF',
    unitId: 'fldJX4h1sTNkacKru',
    avgRating: 'fldOWWeymJQTwlfaY',
  },
  schema: {
    resourceName: 'string',
    resourceType: 'string',
    resourceLink: 'string | null',
    resourceGuide: 'string',
    authors: 'string | null',
    timeFocusOnMins: 'number | null',
    coreFurtherMaybe: 'string',
    readingOrder: 'string',
    unitId: 'string',
    avgRating: 'number | null',
  },
};

export type Exercise = {
  id: string,
  answer: string,
  courseIdWrite: string,
  courseIdRead: string,
  exerciseNumber: string,
  description: string,
  options: string,
  title: string,
  type: string,
  unitId: string,
  unitNumber: string,
  status: string,
} & Item;

export const exerciseTable: Table<Exercise> = {
  name: 'Exercise',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tbla7lc2MtSSbWVvS',
  mappings: {
    answer: 'fldFcZVVo8Wg4GSmA',
    courseIdWrite: 'fldxcJ5gCihs3iRyE',
    courseIdRead: 'fldc9oyPwJSkeMiAW',
    exerciseNumber: 'fldOoKVFSrToAicfT',
    description: 'fldsoGDZ4d8Us64f1',
    options: 'fld38NpFZT4BdhWO3',
    title: 'fldVlrg0E4bV2xAcs',
    type: 'fldGXsdS2o3EnjNg9',
    unitId: 'fld2KJRxb50MbtrJc',
    unitNumber: 'fldL42M2hgchJYIdD',
    status: 'flda5e542i9w1nBzv',
  },
  schema: {
    answer: 'string',
    courseIdWrite: 'string',
    courseIdRead: 'string',
    exerciseNumber: 'string',
    description: 'string',
    options: 'string',
    title: 'string',
    type: 'string',
    unitId: 'string',
    unitNumber: 'string',
    status: 'string',
  },
};

export type ExerciseResponse = {
  id: string,
  email: string,
  exerciseId: string,
  response: string,
  completed: boolean,
} & Item;

export const exerciseResponseTable: Table<ExerciseResponse> = {
  name: 'Exercise response',
  baseId: 'appnJbsG1eWbAdEvf',
  tableId: 'tblLNijbqwoLtkd3O',
  mappings: {
    email: 'fldI5oHurlbNjQJmM',
    exerciseId: 'fldSKltln4l3yYdi2',
    response: 'fld7Qa3JDnRNwCTlH',
    completed: 'fldz8rocQd7Ws9s2q',
  },
  schema: {
    email: 'string',
    exerciseId: 'string',
    response: 'string',
    completed: 'boolean',
  },
};

export type CourseRegistration = {
  id: string,
  userId: string | null,
  email: string,
  firstName: string,
  lastName: string,
  fullName: string,
  /** Link to the course record in the applications base */
  courseApplicationsBaseId: string,
  /** Underlying id, consistent with course builder. Read only */
  courseId: string,
  decision: string,
  role: string,
  certificateId: string | null,
  certificateCreatedAt: number | null,
} & Item;

export const courseRegistrationTable: Table<CourseRegistration> = {
  name: 'Course registration',
  baseId: 'appnJbsG1eWbAdEvf',
  tableId: 'tblXKnWoXK3R63F6D',
  mappings: {
    userId: 'fldyVcp78eIfqmai3',
    email: 'fld0g392xytratknm',
    firstName: 'fldIhZ4wc5t1Yabgz',
    lastName: 'fldHa6GR5aBsOBtkz',
    fullName: 'fld1rOZGAHBRcdJcM',
    courseApplicationsBaseId: 'fldPkqPbeoIhERqSY',
    courseId: 'fldFTXtevzOc29Qte',
    decision: 'fldWVKY5EFAGSRcDT',
    role: 'fld52Y2AyWV8tECDy',
    certificateId: 'fld9hQE0EvdKRsp9k',
    certificateCreatedAt: 'fldQJyVjaiQzsVGD9',
  },
  schema: {
    userId: 'string | null',
    email: 'string',
    firstName: 'string',
    lastName: 'string',
    fullName: 'string',
    courseApplicationsBaseId: 'string',
    courseId: 'string',
    decision: 'string',
    role: 'string',
    certificateId: 'string | null',
    certificateCreatedAt: 'number | null',
  },
};

export type User = {
  id: string,
  email: string,
  createdAt: string,
  lastSeenAt: string | null,
  name: string,
  referralId: string,
  referredById: string,
  utmSource: string,
  utmCampaign: string,
  utmContent: string,
} & Item;

export const userTable: Table<User> = {
  name: 'User',
  baseId: 'appnJbsG1eWbAdEvf',
  tableId: 'tblCgeKADNDSCXPpR',
  mappings: {
    email: 'fldLAGRfn7S6uEVRo',
    createdAt: 'fld2AGYp0VLOz3Pg6',
    lastSeenAt: 'fldOFCUM6lD5Mne9Y',
    name: 'fldULI4CXDWAUmRM2',
    referralId: 'fldTT0LY0pZsOwQ4w',
    referredById: 'flditAk6CtQxCfHf8',
    utmSource: 'fldl1gTMXI44BvCUS',
    utmCampaign: 'fldcNcqMxSFpmiGWT',
    utmContent: 'fldlpjcdh7jpZhHhv',
  },
  schema: {
    email: 'string',
    createdAt: 'string',
    lastSeenAt: 'string | null',
    name: 'string',
    referralId: 'string',
    referredById: 'string',
    utmSource: 'string',
    utmCampaign: 'string',
    utmContent: 'string',
  },
};

export type CmsBlog = {
  id: string,
  title: string,
  slug: string,
  body: string,
  publishedAt: number,
  authorName: string,
  authorUrl: string,
  /** "Published" | "Unlisted" | "Unpublished" */
  publicationStatus: string,
} & Item;

export const cmsBlogTable: Table<CmsBlog> = {
  name: 'Blog',
  baseId: 'app63L1YChHfS6RJF',
  tableId: 'tblT8jgeG4QWX2Fj4',
  mappings: {
    title: 'fldB4uHuTqUd4JOsw',
    slug: 'fldSy5THCV7WOtYiN',
    body: 'fldesLVb1tJpsNkVl',
    authorName: 'fldBVD1meb54zRK8Q',
    authorUrl: 'fldEOlPQdbEmDxicJ',
    publishedAt: 'fldjp3x46apAPAXo7',
    publicationStatus: 'fldiDvLbKKWNPeny4',
  },
  schema: {
    title: 'string',
    slug: 'string',
    body: 'string',
    publishedAt: 'number',
    authorName: 'string',
    authorUrl: 'string',
    publicationStatus: 'string',
  },
};

export type CmsJobPosting = {
  id: string,
  title: string,
  subtitle: string,
  slug: string,
  applicationUrl: string,
  body: string,
  /** "Published" | "Unlisted" | "Unpublished" */
  publicationStatus: string,
  publishedAt: number | null,
} & Item;

export const cmsJobPostingTable: Table<CmsJobPosting> = {
  name: 'Job posting',
  baseId: 'app63L1YChHfS6RJF',
  tableId: 'tblGv8yisIfJMjT6K',
  mappings: {
    title: 'fldN51J9NLxyRBEDf',
    subtitle: 'fldhiAectnNMEmUt5',
    slug: 'fldiMgiy9wHuvIM2f',
    applicationUrl: 'fldtkliaGs8JLy0BS',
    body: 'fldiBF58TPRIMhgvq',
    publicationStatus: 'fld4cZjg7YiEDaZXg',
    publishedAt: 'fldI1yVd0G5eCvWiy',
  },
  schema: {
    title: 'string',
    subtitle: 'string',
    slug: 'string',
    applicationUrl: 'string',
    body: 'string',
    publicationStatus: 'string',
    publishedAt: 'number | null',
  },
};

export type CmsProject = {
  id: string,
  title: string,
  slug: string,
  body: string,
  authorName: string,
  authorUrl: string,
  coverImageSrc: string,
  publishedAt: number,
  publicationStatus: string,
  course: string,
  tag: string[],
} & Item;

export const cmsProjectTable: Table<CmsProject> = {
  name: 'Project',
  baseId: 'app63L1YChHfS6RJF',
  tableId: 'tblYCFWqPy29YIWe6',
  mappings: {
    title: 'fldGyQnG2U6q5p5ny',
    slug: 'fldX2rzTLpj9P9fdP',
    body: 'fldjW7BnaXVCttBQn',
    authorName: 'fldGpZHynFhhAx13S',
    authorUrl: 'fldJiHv2mFQzEdz7L',
    coverImageSrc: 'fldliLiVCys4rLX7S',
    publishedAt: 'fldoTpdgfEBNQgej9',
    publicationStatus: 'fldn7RrnTe80QUEt6',
    course: 'fldNHNMuxmQjaokmY',
    tag: 'fldeTqWZOvybdopnK',
  },
  schema: {
    title: 'string',
    slug: 'string',
    body: 'string',
    authorName: 'string',
    authorUrl: 'string',
    coverImageSrc: 'string',
    publishedAt: 'number',
    publicationStatus: 'string',
    course: 'string',
    tag: 'string[]',
  },
};

export type ResourceCompletion = {
  id: string,
  unitResourceIdWrite: string,
  unitResourceIdRead: string,
  rating: number | null,
  isCompleted: boolean,
  email: string,
  feedback: string,
} & Item;

export const resourceCompletionTable: Table<ResourceCompletion> = {
  name: 'Resource completions',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tblu6YnR7Lh0Bsl6v',
  mappings: {
    unitResourceIdWrite: 'fldk4dbWAohE312Qn',
    unitResourceIdRead: 'fldoTb7xx0QQVHXvM',
    rating: 'fldq6J5taZX4xLDfD',
    isCompleted: 'fldm74UNAQuC1XkQc',
    email: 'fldXqD5YKVZuTGT35',
    feedback: 'fld68CYhCZ44jHT21',
  },
  schema: {
    unitResourceIdRead: 'string',
    unitResourceIdWrite: 'string',
    rating: 'number | null',
    isCompleted: 'boolean',
    email: 'string',
    feedback: 'string',
  },
};
