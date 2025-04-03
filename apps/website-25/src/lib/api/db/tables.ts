/* eslint-disable */
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