import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, asc, chunkTable, unitTable, InferSelectModel,
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
  const { courseSlug, unitId } = raw.req.query;
  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }
  if (typeof unitId !== 'string') {
    throw new createHttpError.BadRequest('Invalid unit number');
  }

  const units = await db.pg.select()
    .from(unitTable.pg)
    .where(eq(unitTable.pg.courseSlug, courseSlug))
    .orderBy(asc(unitTable.pg.unitNumber));

  const unit = units.find((u) => u.unitNumber === unitId);
  if (!unit) {
    throw new createHttpError.NotFound('Unit not found');
  }

  const chunks = await db.pg.select()
    .from(chunkTable.pg)
    .where(eq(chunkTable.pg.unitId, unit.id || ''))
    .orderBy(asc(chunkTable.pg.chunkOrder));

  return {
    type: 'success' as const,
    units,
    unit,
    chunks,
  };
});
