import {
  and,
  count,
  eq,
  exerciseResponseTable,
  exerciseTable,
  inArray,
  isNotNull,
  RESOURCE_FEEDBACK,
  resourceCompletionTable,
  resourceTable,
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
        const targetIdSet = new Set(ids);
        const counts = Object.fromEntries(ids.map((id) => [id, 0]));

        const rows = await db.pg
          .select({ resourceIds: resourceCompletionTable.pg.resourceId })
          .from(resourceCompletionTable.pg)
          .where(eq(resourceCompletionTable.pg.isCompleted, true));

        for (const row of rows) {
          for (const resourceId of row.resourceIds ?? []) {
            if (targetIdSet.has(resourceId)) {
              counts[resourceId] = (counts[resourceId] ?? 0) + 1;
            }
          }
        }

        return counts;
      },

      computedAverageRating: async (db, ids) => {
        const targetIdSet = new Set(ids);
        const ratingsByResourceId = new Map<string, number[]>();

        const rows = await db.pg
          .select({
            resourceIds: resourceCompletionTable.pg.resourceId,
            rating: resourceCompletionTable.pg.resourceFeedback,
          })
          .from(resourceCompletionTable.pg);

        for (const { rating, resourceIds } of rows) {
          if (rating == null || rating === RESOURCE_FEEDBACK.NO_RESPONSE) continue;
          for (const resourceId of resourceIds ?? []) {
            if (!targetIdSet.has(resourceId)) continue;
            const ratings = ratingsByResourceId.get(resourceId) ?? [];
            ratings.push(rating);
            ratingsByResourceId.set(resourceId, ratings);
          }
        }

        return Object.fromEntries(ids.map((id) => {
          const ratings = ratingsByResourceId.get(id) ?? [];
          if (ratings.length === 0) return [id, null];
          const mean = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          return [id, mean];
        }));
      },
    },
  },
];
