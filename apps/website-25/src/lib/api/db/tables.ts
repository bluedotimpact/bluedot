import { Item, Table } from 'airtable-ts';

export interface Course extends Item {
  id: string,
  title: string,
  description: string,
  url: string,
  displayOnCourseHubIndex: boolean,
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
  },
  schema: {
    title: 'string',
    description: 'string',
    url: 'string',
    displayOnCourseHubIndex: 'boolean',
  },
};

export interface Unit extends Item {
  id: string,
  courseTitle: string,
  title: string,
  content: string,
  unitNumber: string,
  duration: number,
}

export const unitTable: Table<Unit> = {
  name: 'Unit',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tblsDKJ8VCyO619nk',
  mappings: {
    courseTitle: 'fld4AYVyIcfnzfE3Z',
    title: 'fldN9BV8GGUHFu9sz',
    content: 'fldpJLWVPh0IXHfmm',
    duration: 'fldGdibgcMgRbnuvp',
    unitNumber: 'fldimS5GIqSKuyA9C',
  },
  schema: {
    courseTitle: 'string',
    title: 'string',
    content: 'string',
    duration: 'number',
    unitNumber: 'string',
  },
};
