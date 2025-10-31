import {
  and,
  chunkTable,
  eq,
  exerciseTable,
  inArray,
  InferSelectModel,
  unitResourceTable,
  unitTable,
  type Exercise,
  type UnitResource,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import type dbAsType from './db';
import db from './db';

type DB = typeof dbAsType;
type Unit = InferSelectModel<typeof unitTable.pg>;

/**
 * Filter the `chunks` field on each element of `units` to only include the ids of active
 * chunks. This makes it so this array of ids matches the full chunks objects which may be
 * sent to the client.
 *
 * Returns a new (shallow copied) array of units, with only the `chunks` field modified.
 */
export async function unitFilterActiveChunks({
  units,
  db: dbInstance,
}: {
  units: Unit[];
  db: DB;
}): Promise<Unit[]> {
  const allChunkIds = units.map((unit) => unit.chunks ?? []).flat();
  const allActiveChunkIds = new Set(
    (
      await dbInstance.pg
        .select({ id: chunkTable.pg.id })
        .from(chunkTable.pg)
        .where(
          and(
            eq(chunkTable.pg.status, 'Active'),
            inArray(chunkTable.pg.id, allChunkIds),
          ),
        )
    ).map((chunk) => chunk.id),
  );
  return units.map((unit) => ({
    ...unit,
    chunks: unit.chunks?.filter((c) => allActiveChunkIds.has(c)) ?? [],
  }));
}

export type UnitWithContent = Awaited<ReturnType<typeof getUnitWithContent>>;
export async function getUnitWithContent(courseSlug: string, unitNumber: string) {
  // Get all active units for this course, filter the chunks field to only include the ids of active chunks
  const allUnitsWithAllChunks = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });
  const allUnits = await unitFilterActiveChunks({ units: allUnitsWithAllChunks, db });

  // Sort units numerically since database text sorting might not handle numbers correctly
  const units = allUnits.sort((a, b) => parseInt(a.unitNumber) - parseInt(b.unitNumber));

  const unit = units.find((u) => parseInt(u.unitNumber) === parseInt(unitNumber));
  if (!unit) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Unit not found' });
  }

  // Get chunks for this unit, filter for active status, and sort by chunk order
  const allChunks = await db.scan(chunkTable, { unitId: unit.id });
  const activeChunks = allChunks.filter((chunk) => chunk.status === 'Active');
  const chunks = activeChunks.sort((a, b) => (a.chunkOrder || '').localeCompare(b.chunkOrder || '', undefined, { numeric: true, sensitivity: 'base' }));

  // Resolve chunk resources and exercises with proper ordering
  const chunksWithContent = await Promise.all(chunks.map(async (chunk) => {
    let resources: UnitResource[] = [];
    let exercises: Exercise[] = [];

    // Fetch chunk resources
    if (chunk.chunkResources && chunk.chunkResources.length > 0) {
      const resourcePromises = chunk.chunkResources.map((resourceId) => db.get(unitResourceTable, { id: resourceId }).catch(() => null));
      const resolvedResources = await Promise.all(resourcePromises);
      resources = resolvedResources
        .filter((r): r is UnitResource => r !== null)
        .sort((a, b) => {
          // Sort by readingOrder
          const orderA = a.readingOrder ? parseInt(a.readingOrder) : Infinity;
          const orderB = b.readingOrder ? parseInt(b.readingOrder) : Infinity;
          return orderA - orderB;
        });
    }

    // Fetch chunk exercises
    if (chunk.chunkExercises && chunk.chunkExercises.length > 0) {
      const exercisePromises = chunk.chunkExercises.map((exerciseId) => db.get(exerciseTable, { id: exerciseId }).catch(() => null));
      const resolvedExercises = await Promise.all(exercisePromises);

      // Filter for exercises that exist and are active
      exercises = resolvedExercises
        .filter((e): e is Exercise => e !== null && e.status === 'Active')
        .sort((a, b) => {
          // Sort by exerciseNumber field
          const numA = a.exerciseNumber || '';
          const numB = b.exerciseNumber || '';
          return numA.localeCompare(numB, undefined, { numeric: true });
        });
    }

    return {
      ...chunk,
      resources,
      exercises,
    };
  }));

  return {
    units,
    unit,
    chunks: chunksWithContent,
  };
}
