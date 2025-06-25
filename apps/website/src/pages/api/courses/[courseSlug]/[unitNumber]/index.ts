import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  chunkTable, unitTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type Unit = InferSelectModel<typeof unitTable.pg>;
type Chunk = InferSelectModel<typeof chunkTable.pg>;

export type GetUnitResponse = {
  type: 'success',
  units: Unit[],
  unit: Unit,
  chunks: Chunk[],
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

  // Get all active units for this course
  const allUnits = await db.scan(unitTable, { courseSlug, unitStatus: 'Active' });

  // Sort units numerically since database text sorting might not handle numbers correctly
  const units = allUnits.sort((a, b) => parseInt(a.unitNumber) - parseInt(b.unitNumber));

  const unit = units.find((u) => parseInt(u.unitNumber) === parseInt(unitNumber));
  if (!unit) {
    throw new createHttpError.NotFound('Unit not found');
  }

  // Get chunks for this unit and sort by chunk order
  const allChunks = await db.scan(chunkTable, { unitId: unit.id });
  const chunks = allChunks.sort((a, b) => (a.chunkOrder || '').localeCompare(b.chunkOrder || ''));

  return {
    type: 'success' as const,
    units,
    unit,
    chunks,
  };
});
