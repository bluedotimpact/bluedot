import { Item, Table } from 'airtable-ts';

export interface Course extends Item {
  id: string,
  title: string,
  description: string,
  url: string,
  displayOnCourseHubIndex: boolean,
  certificationBadgeImage: string,
  certificatonDescription: string,
  courseUrl: string,
  courseDetailsUrl: string,
}

export const courseTable: Table<Course> = {
  name: 'Course',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tbl6nq5AVLKINBJ73',
  mappings: {
    title: 'fldUyKGqFb7OiY0KF',
    description: 'fldCX0bk6SQuXZaI7',
    url: 'fldblKROooVG5p9UW',
    displayOnCourseHubIndex: 'fldf7ppu9kN4blXU9',
    certificationBadgeImage: 'fldwOxukk9OyUPWDX',
    certificatonDescription: 'fldsxyHg4BLouu7XZ',
    courseUrl: 'fldlnWDzZZPZHP6S1',
    courseDetailsUrl: 'fldblKROooVG5p9UW',
  },
  schema: {
    title: 'string',
    description: 'string',
    url: 'string',
    displayOnCourseHubIndex: 'boolean',
    certificationBadgeImage: 'string',
    certificatonDescription: 'string',
    courseUrl: 'string',
    courseDetailsUrl: 'string',
  },
};

export interface Unit extends Item {
  id: string,
  courseId: string,
  courseTitle: string,
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
    title: 'fldN9BV8GGUHFu9sz',
    content: 'fldpJLWVPh0IXHfmm',
    duration: 'fldGdibgcMgRbnuvp',
    unitNumber: 'fldimS5GIqSKuyA9C',
    description: 'flddCXEeJ9oFOhfNb',
  },
  schema: {
    courseId: 'string',
    courseTitle: 'string',
    title: 'string',
    content: 'string',
    duration: 'number',
    unitNumber: 'string',
    description: 'string',
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
    courseId: 'flda4CZqaugyaftyQ',
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
  courseSitesVisited: string,
  completedMoocAt: number,
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
    courseSitesVisited: 'fldgbXANYvYCEw4OV',
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
    courseSitesVisited: 'string',
    completedMoocAt: 'number',
  },
};
