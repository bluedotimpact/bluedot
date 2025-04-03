/* eslint-disable */
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