import { Item, Table } from 'airtable-ts';

export interface Course extends Item {
  id: string,
  title: string,
  description: string,
  url: string,
}

export const courseTable: Table<Course> = {
  name: 'Course',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tbl6nq5AVLKINBJ73',
  mappings: {
    title: 'fldUyKGqFb7OiY0KF',
    description: 'fldCX0bk6SQuXZaI7',
    url: 'fldblKROooVG5p9UW',
  },
  schema: {
    title: 'string',
    description: 'string',
    url: 'string',
  },
};

export interface Unit extends Item {
  id: string,
  courseId: string,
  title: string,
  content: string,
  duration: number,
}

export const unitTable: Table<Unit> = {
  name: 'Unit',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tblsDKJ8VCyO619nk',
  mappings: {
    courseId: 'fldLmQZ0ISTr7xQUE',
    title: 'fldN9BV8GGUHFu9sz',
    content: 'fldpJLWVPh0IXHfmm',
    duration: 'fldGdibgcMgRbnuvp',
  },
  schema: {
    courseId: 'string',
    title: 'string',
    content: 'string',
    duration: 'number',
  },
};
