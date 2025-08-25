export { PgAirtableDb } from './lib/client';

export {
  metaTable,
  syncMetadataTable,
  unitFeedbackTable,
  exerciseResponseTable,
  courseTable,
  formConfigurationTable,
  personTable,
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
  chunkTable,
  unitTable,
  unitResourceTable,
  exerciseTable,
  applicationsCourseTable,
  courseRegistrationTable,
  userTable,
  resourceCompletionTable,
} from './schema';

export { getPgAirtableFromIds, PgAirtableTable } from './lib/db-core';

// TODO: restrict what's exported
export * from 'drizzle-orm';
