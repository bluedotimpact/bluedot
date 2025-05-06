import type { Item, Table } from 'airtable-ts';

export type Blog = {
  id: string,
  title: string,
  slug: string,
  body: string,
  authorName: string,
  authorUrl: string,
  publishedAt: number,
  publicationStatus: string,
} & Item;

export const blogTable: Table<Blog> = {
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
    authorName: 'string',
    authorUrl: 'string',
    publishedAt: 'number',
    publicationStatus: 'string',
  },
};

export type JobPosting = {
  id: string,
  title: string,
  subtitle: string,
  slug: string,
  applicationUrl: string,
  body: string,
  publicationStatus: string,
} & Item;

export const jobPostingTable: Table<JobPosting> = {
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
  },
  schema: {
    title: 'string',
    subtitle: 'string',
    slug: 'string',
    applicationUrl: 'string',
    body: 'string',
    publicationStatus: 'string',
  },
};
