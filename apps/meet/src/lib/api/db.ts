import { AirtableTs, Table, Item } from 'airtable-ts';
import env from './env';

export default new AirtableTs({
  apiKey: env.AIRTABLE_PERSONAL_ACCESS_TOKEN,
});

const airtableBaseId = 'appPs3sb9BrYZN69z';

export interface Cohort extends Item {
  'cohortSessions': string[],
  'iteration': string,
}

export const cohortTable: Table<Cohort> = {
  name: 'cohort',
  baseId: airtableBaseId,
  tableId: 'tblyiJSPoniwhi17T',
  schema: {
    cohortSessions: 'string[]',
    iteration: 'string',
  },
  mappings: {
    cohortSessions: 'fldwEeC65sHvGGRGb',
    iteration: 'fldtzy3nSP0piVApO',
  },
};

export interface CohortClass extends Item {
  'Facilitators': string[],
  'Participants (Expected)': string[],
  'Attendees': string[],
  'Start date/time': number | null,
  'End date/time': number | null,
  'Cohort': string,
  'Zoom account': string | null,
}

export const cohortClassTable: Table<CohortClass> = {
  name: 'cohort class',
  baseId: airtableBaseId,
  tableId: 'tblDNME0bA9OoApTk',
  schema: {
    Facilitators: 'string[]',
    'Participants (Expected)': 'string[]',
    Attendees: 'string[]',
    'Start date/time': 'number | null',
    'End date/time': 'number | null',
    Cohort: 'string',
    'Zoom account': 'string | null',
  },
  mappings: {
    Facilitators: 'fldP5BqdFfcn8enfc',
    'Participants (Expected)': 'fldEKYwcacAa6nBEE',
    Attendees: 'fldo0xEi6vJKSJlFN',
    'Start date/time': 'flduTqIxS6OEHNr4H',
    'End date/time': 'flda1ONwG37ROVo8e',
    Cohort: 'fldjISs1XFGAwT5k5',
    'Zoom account': 'fldH0pKnEELPI65Qs',
  },
};

export interface Person extends Item {
  'name': string,
}

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

export interface ZoomAccount extends Item {
  'Meeting link': string,
  'Host key': string,
}

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

export interface Iteration extends Item {
  'Course': string,
}

export const iterationTable: Table<Iteration> = {
  name: 'iteration',
  baseId: airtableBaseId,
  tableId: 'tblu6u7F2NHfCMgsk',
  schema: {
    Course: 'string',
  },
  mappings: {
    Course: 'fldvx7D6Uw0VxMPr0',
  },
};

export interface Course extends Item {
  '[*] Course Site': string,
}

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
