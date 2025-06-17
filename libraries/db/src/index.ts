export { PgAirtableDb } from './lib/client';

export {
  metaTable,
  syncMetadataTable,
  unitFeedbackTable,
  exerciseResponseTable,
  courseTable,
  formConfigurationTable,
  personTable,
  opportunityTable,
  sharedDemoOutputTable,
  blogTable,
  jobPostingTable,
  projectTable,
  groupTable,
  groupDiscussionTable,
  meetPersonTable,
  zoomAccountTable,
  roundTable,
  meetCourseTable,
} from './schema';

export { getPgAirtableFromIds, PgAirtableTable } from './lib/db-core';

// TODO: restrict what's exported
export * from 'drizzle-orm';
