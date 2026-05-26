import {
  and, count, exerciseResponseTable, exerciseTable, inArray, isNotNull, type PgAirtableDb,
} from '@bluedot/db';
import { rollupsFor } from './framework';

export const rollupDefinitions = [
  rollupsFor(exerciseTable, {
    numCompletions: computeExerciseCompletions,
  }),
];

async function computeExerciseCompletions(db: PgAirtableDb, ids: string[]): Promise<Map<string, number | null>> {
  const response = exerciseResponseTable.pg;
  const rows = await db.pg
    .select({ exerciseId: response.exerciseId, n: count() })
    .from(response)
    .where(and(isNotNull(response.completedAt), inArray(response.exerciseId, ids)))
    .groupBy(response.exerciseId);

  const counts = new Map(rows.map((row) => [row.exerciseId, Number(row.n)]));
  return new Map(ids.map((id) => [id, counts.get(id) ?? 0]));
}
