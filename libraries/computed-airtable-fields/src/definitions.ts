import {
  and,
  arrayOverlaps,
  count,
  eq,
  exerciseResponseTable,
  exerciseTable,
  inArray,
  isNotNull,
  ne,
  RESOURCE_FEEDBACK,
  resourceCompletionTable,
  resourceTable,
  sql,
} from '@bluedot/db';
import type { ComputedAirtableFieldGroup } from './core';

export const computedAirtableFieldDefinitions: ComputedAirtableFieldGroup[] = [
  {
    table: exerciseTable,
    fields: {
      computedNumResponses: async (db, ids) => {
        const response = exerciseResponseTable.pg;
        const rows = await db.pg
          .select({ exerciseId: response.exerciseId, n: count() })
          .from(response)
          .where(and(
            isNotNull(response.completedAt),
            inArray(response.exerciseId, ids),
          ))
          .groupBy(response.exerciseId);

        const counts = Object.fromEntries(rows.map((row) => [row.exerciseId, Number(row.n)]));
        return Object.fromEntries(ids.map((id) => [id, counts[id] ?? 0]));
      },
    },
  },
  {
    table: resourceTable,
    fields: {
      computedNumCompletions: async (db, ids) => {
        // unnest expands the resourceId array so we can group/count per id.
        const rid = sql<string>`unnest(${resourceCompletionTable.pg.resourceId})`.as('rid');
        const rows = await db.pg
          .select({ rid, n: count() })
          .from(resourceCompletionTable.pg)
          .where(and(
            eq(resourceCompletionTable.pg.isCompleted, true),
            arrayOverlaps(resourceCompletionTable.pg.resourceId, ids),
          ))
          .groupBy(rid);

        // Overlap filter may include unrelated ids from multi-resource rows — keep only chunk ids.
        const targetIdSet = new Set(ids);
        const counts = Object.fromEntries(ids.map((id) => [id, 0]));
        for (const { rid: id, n } of rows) {
          if (targetIdSet.has(id)) counts[id] = Number(n);
        }

        return counts;
      },

      computedAverageRating: async (db, ids) => {
        const rid = sql<string>`unnest(${resourceCompletionTable.pg.resourceId})`.as('rid');
        const rows = await db.pg
          .select({
            rid,
            avg: sql<string>`avg(${resourceCompletionTable.pg.resourceFeedback})`,
          })
          .from(resourceCompletionTable.pg)
          .where(and(
            // Ratings on uncompleted rows are ignored — same notion of "exists" as computedNumCompletions.
            eq(resourceCompletionTable.pg.isCompleted, true),
            arrayOverlaps(resourceCompletionTable.pg.resourceId, ids),
            // != NO_RESPONSE also excludes NULL (NULL != 0 → UNKNOWN, filtered out).
            ne(resourceCompletionTable.pg.resourceFeedback, RESOURCE_FEEDBACK.NO_RESPONSE),
          ))
          .groupBy(rid);

        const targetIdSet = new Set(ids);
        const result: Record<string, number | null> = Object.fromEntries(ids.map((id) => [id, null]));
        for (const { rid: id, avg } of rows) {
          if (targetIdSet.has(id) && avg != null) result[id] = Number(avg);
        }

        return result;
      },
    },
  },
];
