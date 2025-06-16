export { PgAirtableDb } from './lib/client';

export {
  metaTable,
  syncMetadataTable,
  unitFeedbackTable,
  exerciseResponseTable,
  courseTable,
} from './schema';

export { getPgAirtableFromIds, type PgAirtableTable } from './lib/db-core';

// TODO: restrict what's exported
export * from 'drizzle-orm';
