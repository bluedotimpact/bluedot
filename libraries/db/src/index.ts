export { PgAirtableDb } from './lib/client';
export type { PgDatabase } from './lib/client';
export {
  createTestPgClient, createTestAirtableClient, createTestDbClients, pushTestSchema, resetTestDb,
} from './lib/test-db';
export type { TestPgAirtableDb } from './lib/test-db';

export {
  metaTable,
  syncMetadataTable,
  syncRequestsTable,
  exerciseResponseTable,
  courseTable,
  formConfigurationTable,
  personTable,
  sharedDemoOutputTable,
  blogTable,
  jobPostingTable,
  projectTable,
  missionTable,
  groupTable,
  groupSwitchingTable,
  groupDiscussionTable,
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
  facilitatorDiscussionSwitchingTable,
  dropoutTable,
  teamMemberTable,
  testimonialTable,
  rapidGrantTable,
  careerTransitionGrantTable,
  careerTransitionGrantApplicationTable,
  rapidGrantApplicationTable,
  bugReportsTable,
  courseFeedbackTable,
  peerFeedbackTable,
} from './schema';

// Type exports
export type {
  Meta,
  SyncMetadata,
  SyncRequest,
  SyncStatus,
  Course,
  ExerciseResponse,
  FormConfiguration,
  Person,
  SharedDemoOutput,
  Group,
  GroupDiscussion,
  GroupSwitching,
  MeetPerson,
  ZoomAccount,
  Round,
  ApplicationsRound,
  MeetCourse,
  Blog,
  JobPosting,
  Project,
  Mission,
  Chunk,
  Unit,
  UnitResource,
  Exercise,
  ApplicationsCourse,
  CourseRegistration,
  User,
  ResourceCompletion,
  FacilitatorSwitching,
  Dropout,
  TeamMember,
  Testimonial,
  RapidGrant,
  CareerTransitionGrant,
  CareerTransitionGrantApplication,
  RapidGrantApplication,
  BugReport,
  CourseFeedback,
  PeerFeedback,
} from './schema';

export { getPgAirtableFromIds, PgAirtableTable } from './lib/db-core';

export { AirtableTsError, ErrorType } from 'airtable-ts/dist/AirtableTsError';

// TODO: restrict what's exported
export * from 'drizzle-orm';
