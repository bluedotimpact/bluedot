import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  chunkTable,
  unitTable,
  unitResourceTable,
  exerciseTable,
  Unit,
  Chunk,
  UnitResource,
  Exercise,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import { unitFilterActiveChunks } from '../../../../../lib/api/utils';

type ChunkWithContent = Chunk & {
  resources: UnitResource[];
  exercises: Exercise[];
};

export type GetUnitResponse = {
  type: 'success',
  units: Unit[],
  unit: Unit,
  chunks: ChunkWithContent[],
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    units: z.array(z.any()),
    unit: z.any(),
    chunks: z.array(z.any()),
  }),
}, async (body, { raw }) => {
  const { courseSlug, unitNumber } = raw.req.query;
  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }
  if (typeof unitNumber !== 'string') {
    throw new createHttpError.BadRequest('Invalid unit number');
  }

  // Get all active units for this course, filter the chunks field to only include the ids of active chunks
  const allUnitsWithAllChunks = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });
  const allUnits = await unitFilterActiveChunks({ units: allUnitsWithAllChunks, db });

  // Sort units numerically since database text sorting might not handle numbers correctly
  const units = allUnits.sort((a, b) => parseInt(a.unitNumber) - parseInt(b.unitNumber));

  const unit = units.find((u) => parseInt(u.unitNumber) === parseInt(unitNumber));
  if (!unit) {
    throw new createHttpError.NotFound('Unit not found');
  }

  // Get chunks for this unit, filter for active status, and sort by chunk order
  let allChunks;
  try {
    allChunks = await db.scan(chunkTable, { unitId: unit.id });
  } catch (error) {
    throw new createHttpError.InternalServerError('Database error occurred');
  }
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
          // Sort by readingORder
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
    type: 'success' as const,
    units,
    unit,
    chunks: chunksWithContent,
  };
});
