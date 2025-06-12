export { PgAirtableDb } from './lib/client';

export {
  metaTable,
  unitFeedbackTable,
  exerciseResponseTable,
  courseTable,
} from './schema';

export { getPgAirtableFromIds, type PgAirtableTable } from './lib/db-core';

export * from 'drizzle-orm';
