import { Item, Table } from 'airtable-ts';

export interface Course extends Item {
  id: string,
  title: string,
  description: string,
  displayOnCourseHubIndex: boolean,
  certificationBadgeImage: string,
  certificatonDescription: string,
  path: string,
  detailsUrl: string,
  units: string[],
}

export const courseTable: Table<Course> = {
  name: 'Course',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tbl6nq5AVLKINBJ73',
  mappings: {
    title: 'fldUyKGqFb7OiY0KF',
    description: 'fldCX0bk6SQuXZaI7',
    displayOnCourseHubIndex: 'fldf7ppu9kN4blXU9',
    certificationBadgeImage: 'fldwOxukk9OyUPWDX',
    certificatonDescription: 'fldsxyHg4BLouu7XZ',
    path: 'fldEjx0ZP8SNYcNQR',
    detailsUrl: 'fldblKROooVG5p9UW',
    units: 'fldxi3h4LD2Bs3efO',
  },
  schema: {
    title: 'string',
    description: 'string',
    displayOnCourseHubIndex: 'boolean',
    certificationBadgeImage: 'string',
    certificatonDescription: 'string',
    path: 'string',
    detailsUrl: 'string',
    units: 'string[]',
  },
};

export interface UnitFeedback extends Item {
  unitId: string,
  overallRating: number,
  anythingElse: string,
  userEmail: string,
  userFullName: string,
  createdAt: string | null,
  lastModified: string | null,
}

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

export interface Unit extends Item {
  id: string,
  courseId: string,
  courseTitle: string,
  coursePath: string,
  courseSlug: string,
  path: string,
  title: string,
  content: string,
  unitNumber: string,
  duration: number,
  description: string,
}

export const unitTable: Table<Unit> = {
  name: 'Unit',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tblsDKJ8VCyO619nk',
  mappings: {
    courseId: 'fldLmQZ0ISTr7xQUE',
    courseTitle: 'fld4AYVyIcfnzfE3Z',
    coursePath: 'fldlCrg7Nv1TPTorZ',
    courseSlug: 'fldr9I5YGRIia8xln',
    path: 'fldEY7ZHZtXrBL3nv',
    title: 'fldN9BV8GGUHFu9sz',
    content: 'fldF9hjDhZpLbBIUV',
    duration: 'fldGdibgcMgRbnuvp',
    unitNumber: 'fldimS5GIqSKuyA9C',
    description: 'flddCXEeJ9oFOhfNb',
  },
  schema: {
    courseId: 'string',
    courseTitle: 'string',
    coursePath: 'string',
    courseSlug: 'string',
    path: 'string',
    title: 'string',
    content: 'string',
    duration: 'number',
    unitNumber: 'string',
    description: 'string',
  },
};

export interface Exercise extends Item {
  id: string,
  answer: string,
  courseId: string,
  exerciseNumber: string,
  description: string,
  options: string,
  title: string,
  type: string,
  unitId: string,
  unitNumber: string,
}

export const exerciseTable: Table<Exercise> = {
  name: 'Exercise',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tbla7lc2MtSSbWVvS',
  mappings: {
    answer: 'fldFcZVVo8Wg4GSmA',
    courseId: 'fldxcJ5gCihs3iRyE',
    exerciseNumber: 'fldOoKVFSrToAicfT',
    description: 'fldsoGDZ4d8Us64f1',
    options: 'fld38NpFZT4BdhWO3',
    title: 'fldVlrg0E4bV2xAcs',
    type: 'fldGXsdS2o3EnjNg9',
    unitId: 'fldqHO0BqQQCbxWTm',
    unitNumber: 'fldL42M2hgchJYIdD',
  },
  schema: {
    answer: 'string',
    courseId: 'string',
    exerciseNumber: 'string',
    description: 'string',
    options: 'string',
    title: 'string',
    type: 'string',
    unitId: 'string',
    unitNumber: 'string',
  },
};

export interface ExerciseResponse extends Item {
  id: string,
  email: string,
  exerciseId: string,
  response: string,
  completed: boolean,
}

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

export interface CourseRegistration extends Item {
  id: string,
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
  fullName: string,
  courseId: string,
  decision: string,
  role: string,
  certificateId: string,
  certificateCreatedAt: number,
}

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
    courseId: 'fldPkqPbeoIhERqSY',
    decision: 'fldWVKY5EFAGSRcDT',
    role: 'fld52Y2AyWV8tECDy',
    certificateId: 'fld9hQE0EvdKRsp9k',
    certificateCreatedAt: 'fldQJyVjaiQzsVGD9',
  },
  schema: {
    userId: 'string',
    email: 'string',
    firstName: 'string',
    lastName: 'string',
    fullName: 'string',
    courseId: 'string',
    decision: 'string',
    role: 'string',
    certificateId: 'string',
    certificateCreatedAt: 'number',
  },
};

export interface User extends Item {
  id: string,
  email: string,
  createdAt: string,
  lastSeenAt: string,
  name: string,
  referralId: string,
  referredById: string,
  utmSource: string,
  utmCampaign: string,
  utmContent: string,
  courseSitesVisitedCsv: string,
  completedMoocAt: number | null,
}

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
    courseSitesVisitedCsv: 'fldgbXANYvYCEw4OV',
    completedMoocAt: 'fldTCSAIKNs4nPfDn',
  },
  schema: {
    email: 'string',
    createdAt: 'string',
    lastSeenAt: 'string',
    name: 'string',
    referralId: 'string',
    referredById: 'string',
    utmSource: 'string',
    utmCampaign: 'string',
    utmContent: 'string',
    courseSitesVisitedCsv: 'string',
    completedMoocAt: 'number | null',
  },
};
