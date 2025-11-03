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
