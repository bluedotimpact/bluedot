import { z } from 'zod';
import createHttpError from 'http-errors';
import { AirtableTsTable, formula } from 'airtable-ts-formula';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import {
  chunkTable,
  Unit,
  unitTable,
  Chunk,
} from '../../../../../lib/api/db/tables';

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

  const units = (await db.scan(unitTable, {
    filterByFormula: formula(await db.table(unitTable) as AirtableTsTable<Unit>, [
      '=',
      { field: 'courseSlug' },
      courseSlug,
    ]),
  })).sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  const unit = units.find((u) => u.unitNumber === unitId);
  if (!unit) {
    throw new createHttpError.NotFound('Unit not found');
  }

  const chunks = (await db.scan(chunkTable, {
    filterByFormula: formula(await db.table(chunkTable) as AirtableTsTable<Chunk>, [
      '=',
      { field: 'unitId' },
      unit.id,
    ]),
  })).sort((a, b) => Number(a.chunkOrder) - Number(b.chunkOrder));

  return {
    type: 'success' as const,
    units,
    unit,
    chunks,
  };
});
