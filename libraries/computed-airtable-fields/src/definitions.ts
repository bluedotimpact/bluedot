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
  type PgAirtableDb,
} from '@bluedot/db';
import type { ComputedAirtableFieldDefinition, ComputedAirtableFieldValue } from './core';

export const computedAirtableFieldDefinitions: ComputedAirtableFieldDefinition[] = [
  {
    table: exerciseTable,
    // TODO don't like plaintext field name
    field: 'computedNumResponses',
    // TODO don't like non-inline definitions
    compute: computeExerciseNumResponses,
  },
  {
    table: resourceTable,
    field: 'computedNumCompletions',
    compute: computeResourceNumCompletions,
  },
  {
    table: resourceTable,
    field: 'computedAverageRating',
    compute: computeResourceAverageRatings,
  },
];

async function computeExerciseNumResponses(
  db: PgAirtableDb,
  targetIds: string[],
): Promise<Record<string, ComputedAirtableFieldValue>> {
  if (targetIds.length === 0) return {};

  const response = exerciseResponseTable.pg;
  const rows = await db.pg
    .select({ exerciseId: response.exerciseId, n: count() })
    .from(response)
    .where(and(
      isNotNull(response.completedAt),
      inArray(response.exerciseId, targetIds),
    ))
    .groupBy(response.exerciseId);

  const counts = Object.fromEntries(rows.map((row) => [row.exerciseId, Number(row.n)]));
  return Object.fromEntries(targetIds.map((id) => [id, counts[id] ?? 0]));
}

async function computeResourceNumCompletions(
  db: PgAirtableDb,
  targetIds: string[],
): Promise<Record<string, ComputedAirtableFieldValue>> {
  if (targetIds.length === 0) return {};

  const targetIdSet = new Set(targetIds);
  const counts = Object.fromEntries(targetIds.map((id) => [id, 0]));

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
}

async function computeResourceAverageRatings(
  db: PgAirtableDb,
  targetIds: string[],
): Promise<Record<string, ComputedAirtableFieldValue>> {
  if (targetIds.length === 0) return {};

  const targetIdSet = new Set(targetIds);
  const ratingsByResourceId = new Map<string, number[]>();

  const rows = await db.pg
    .select({
      resourceIds: resourceCompletionTable.pg.resourceId,
      rating: resourceCompletionTable.pg.resourceFeedback,
    })
    .from(resourceCompletionTable.pg);

  for (const { rating, resourceIds } of rows) {
    if (rating == null || rating === RESOURCE_FEEDBACK.NO_RESPONSE) {
      continue;
    }

    for (const resourceId of resourceIds ?? []) {
      if (!targetIdSet.has(resourceId)) {
        continue;
      }

      const ratings = ratingsByResourceId.get(resourceId) ?? [];
      ratings.push(rating);
      ratingsByResourceId.set(resourceId, ratings);
    }
  }

  return Object.fromEntries(targetIds.map((id) => {
    const ratings = ratingsByResourceId.get(id) ?? [];
    if (ratings.length === 0) {
      return [id, null];
    }

    const mean = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    return [id, mean];
  }));
}
