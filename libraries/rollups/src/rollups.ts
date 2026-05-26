import {
  and, count, eq, exerciseResponseTable, exerciseTable, inArray, isNotNull, resourceCompletionTable,
  unitResourceTable, type PgAirtableDb,
} from '@bluedot/db';
import type { RollupGroup } from './core';

export const rollupDefinitions: RollupGroup[] = [
  {
    table: exerciseTable,
    fields: {
      numCompletions: async (db: PgAirtableDb, ids: string[]) => {
        const response = exerciseResponseTable.pg;
        const rows = await db.pg
          .select({ exerciseId: response.exerciseId, n: count() })
          .from(response)
          .where(and(isNotNull(response.completedAt), inArray(response.exerciseId, ids)))
          .groupBy(response.exerciseId);

        const counts = Object.fromEntries(rows.map((row) => [row.exerciseId, Number(row.n)]));
        return Object.fromEntries(ids.map((id) => [id, counts[id] ?? 0]));
      },
    },
  },
  {
    table: unitResourceTable,
    fields: {
      numCompletions: async (db: PgAirtableDb, ids: string[]) => {
        const completion = resourceCompletionTable.pg;
        const rows = await db.pg
          .select({ unitResourceId: completion.unitResourceId, n: count() })
          .from(completion)
          .where(and(eq(completion.isCompleted, true), inArray(completion.unitResourceId, ids)))
          .groupBy(completion.unitResourceId);

        const counts = Object.fromEntries(rows.map((row) => [row.unitResourceId, Number(row.n)]));
        return Object.fromEntries(ids.map((id) => [id, counts[id] ?? 0]));
      },
    },
  },
];
