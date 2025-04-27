import { Table, Item } from 'airtable-ts';

const airtableBaseId = 'appPs3sb9BrYZN69z';

export type Group = {
  'groupDiscussions': string[],
  'round': string,
} & Item;

export const groupTable: Table<Group> = {
  name: 'group',
  baseId: airtableBaseId,
  tableId: 'tblyiJSPoniwhi17T',
  schema: {
    groupDiscussions: 'string[]',
    round: 'string',
  },
  mappings: {
    groupDiscussions: 'fldwEeC65sHvGGRGb',
    round: 'fldtzy3nSP0piVApO',
  },
};

export type GroupDiscussion = {
  'Facilitators': string[],
  'Participants (Expected)': string[],
  'Attendees': string[],
  'Start date/time': number | null,
  'End date/time': number | null,
  'Group': string,
  'Zoom account': string | null,
} & Item;

export const groupDiscussionTable: Table<GroupDiscussion> = {
  name: 'group discussion',
  baseId: airtableBaseId,
  tableId: 'tblDNME0bA9OoApTk',
  schema: {
    Facilitators: 'string[]',
    'Participants (Expected)': 'string[]',
    Attendees: 'string[]',
    'Start date/time': 'number | null',
    'End date/time': 'number | null',
    Group: 'string',
    'Zoom account': 'string | null',
  },
  mappings: {
    Facilitators: 'fldP5BqdFfcn8enfc',
    'Participants (Expected)': 'fldEKYwcacAa6nBEE',
    Attendees: 'fldo0xEi6vJKSJlFN',
    'Start date/time': 'flduTqIxS6OEHNr4H',
    'End date/time': 'flda1ONwG37ROVo8e',
    Group: 'fldjISs1XFGAwT5k5',
    'Zoom account': 'fldH0pKnEELPI65Qs',
  },
};

export type Person = {
  'name': string,
} & Item;

export const personTable: Table<Person> = {
  name: 'person',
  baseId: airtableBaseId,
  tableId: 'tblBeMxAM1FAW06n4',
  schema: {
    name: 'string',
  },
  mappings: {
    name: 'fldP4ejaYy137J5Md',
  },
};

export type ZoomAccount = {
  'Meeting link': string,
  'Host key': string,
} & Item;

export const zoomAccountTable: Table<ZoomAccount> = {
  name: 'zoom account',
  baseId: airtableBaseId,
  tableId: 'tblF61F1xXUnpB13S',
  schema: {
    'Meeting link': 'string',
    'Host key': 'string',
  },
  mappings: {
    'Meeting link': 'fldF5V0uf7jYAxHu5',
    'Host key': 'fldprdNVzdeAU1cRH',
  },
};

export type Round = {
  'Course': string,
} & Item;

export const roundTable: Table<Round> = {
  name: 'round',
  baseId: airtableBaseId,
  tableId: 'tblu6u7F2NHfCMgsk',
  schema: {
    Course: 'string',
  },
  mappings: {
    Course: 'fldvx7D6Uw0VxMPr0',
  },
};

export type Course = {
  '[*] Course Site': string,
} & Item;

export const courseTable: Table<Course> = {
  name: 'course',
  baseId: airtableBaseId,
  tableId: 'tblO0sgD3ioedaqDw',
  schema: {
    '[*] Course Site': 'string',
  },
  mappings: {
    '[*] Course Site': 'fldzJ2h89blzv6MSb',
  },
};
