export { PgAirtableDb } from './lib/client';

export {
  metaTable,
  syncMetadataTable,
  syncRequestsTable,
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
  groupSwitchingTable,
  groupDiscussionTable,
  courseRunnerBucketTable,
  meetPersonTable,
  zoomAccountTable,
  roundTable,
  applicationsRoundTable,
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

// Type exports
export type {
  Meta,
  SyncMetadata,
  SyncRequest,
  SyncStatus,
  Course,
  UnitFeedback,
  ExerciseResponse,
  FormConfiguration,
  Person,
  SharedDemoOutput,
  Group,
  GroupDiscussion,
  GroupSwitching,
  CourseRunnerBucket,
  MeetPerson,
  ZoomAccount,
  Round,
  ApplicationsRound,
  MeetCourse,
  Blog,
  JobPosting,
  Project,
  Chunk,
  Unit,
  UnitResource,
  Exercise,
  ApplicationsCourse,
  CourseRegistration,
  User,
  ResourceCompletion,
} from './schema';

export { getPgAirtableFromIds, PgAirtableTable } from './lib/db-core';

export { AirtableTsError, ErrorType } from 'airtable-ts/dist/AirtableTsError';

// TODO: restrict what's exported
export * from 'drizzle-orm';
