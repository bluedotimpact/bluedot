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
  title: string,
  content: string,
  displayOnTarinTest: number,
}

export const unitTable: Table<Unit> = {
  name: 'Unit',
  baseId: 'appbiNKDcn1sGPGOG',
  tableId: 'tblsDKJ8VCyO619nk',
  mappings: {
    title: 'fldN9BV8GGUHFu9sz',
    content: 'fldpJLWVPh0IXHfmm',
    displayOnTarinTest: 'fld6kMTMs399FQxXl',
  },
  schema: {
    title: 'string',
    content: 'string',
    displayOnTarinTest: 'number',
  },
};
