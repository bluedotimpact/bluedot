import { z } from 'zod';
import createHttpError from 'http-errors';
import { AirtableTsTable, formula } from 'airtable-ts-formula';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import {
  Exercise, exerciseTable, Unit, UnitResource, unitResourceTable, unitTable,
} from '../../../../../lib/api/db/tables';

export type GetUnitResourcesResponse = {
  type: 'success',
  unitResources: UnitResource[],
  unitExercises: Exercise[],
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    unitResources: z.array(z.any()),
    unitExercises: z.array(z.any()),
  }),
}, async (body, { raw }) => {
  const { courseSlug, unitId } = raw.req.query;
  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }
  if (typeof unitId !== 'string') {
    throw new createHttpError.BadRequest('Invalid unit number');
  }

  const unit = (await db.scan(unitTable, {
    filterByFormula: formula(await db.table(unitTable) as AirtableTsTable<Unit>, [
      'AND',
      ['=', { field: 'courseSlug' }, courseSlug],
      ['=', { field: 'unitNumber' }, unitId],
    ]),
  }))[0];
  if (!unit) {
    throw new createHttpError.NotFound('Unit not found');
  }

  const unitResources = await db.scan(unitResourceTable, {
    filterByFormula: formula(await db.table(unitResourceTable), [
      'AND',
      ['=', { field: 'unitId' }, unit.id],
      ['OR', ['=', { field: 'coreFurtherMaybe' }, 'Core'], ['=', { field: 'coreFurtherMaybe' }, 'Further']],
    ]),
  });

  // Sort resources by core/further, then reading order
  unitResources.sort((a, b) => {
    const isCoreA = a.coreFurtherMaybe === 'Core' ? 1 : 0;
    const isCoreB = b.coreFurtherMaybe === 'Core' ? 1 : 0;
    if (isCoreA !== isCoreB) {
      return isCoreB - isCoreA;
    }
    const orderA = parseInt(a.readingOrder) || Infinity;
    const orderB = parseInt(b.readingOrder) || Infinity;
    return orderA - orderB;
  });

  const unitExercises = await db.scan(exerciseTable, {
    filterByFormula: formula(await db.table(exerciseTable), [
      'AND',
      ['=', { field: 'unitId' }, unit.id],
      ['=', { field: 'status' }, 'Active'],
    ]),
  });

  unitExercises.sort((a, b) => Number(a.exerciseNumber) - Number(b.exerciseNumber));

  return {
    type: 'success' as const,
    unitResources,
    unitExercises,
  };
});
