import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, or, asc, exerciseTable, unitResourceTable, unitTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type Exercise = InferSelectModel<typeof exerciseTable.pg>;
type UnitResource = InferSelectModel<typeof unitResourceTable.pg>;

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

  const units = await db.pg.select()
    .from(unitTable.pg)
    .where(and(
      eq(unitTable.pg.courseSlug, courseSlug),
      eq(unitTable.pg.unitNumber, unitId),
    ));

  const unit = units[0];
  if (!unit) {
    throw new createHttpError.NotFound('Unit not found');
  }

  const unitResources = await db.pg.select()
    .from(unitResourceTable.pg)
    .where(and(
      eq(unitResourceTable.pg.unitId, unit.id),
      or(
        eq(unitResourceTable.pg.coreFurtherMaybe, 'Core'),
        eq(unitResourceTable.pg.coreFurtherMaybe, 'Further'),
      ),
    ));

  // Sort resources by core/further, then reading order
  unitResources.sort((a, b) => {
    const isCoreA = a.coreFurtherMaybe === 'Core' ? 1 : 0;
    const isCoreB = b.coreFurtherMaybe === 'Core' ? 1 : 0;
    if (isCoreA !== isCoreB) {
      return isCoreB - isCoreA;
    }
    const orderA = parseInt(a.readingOrder || '0') || Infinity;
    const orderB = parseInt(b.readingOrder || '0') || Infinity;
    return orderA - orderB;
  });

  const unitExercises = await db.pg.select()
    .from(exerciseTable.pg)
    .where(and(
      eq(exerciseTable.pg.unitId, unit.id),
      eq(exerciseTable.pg.status, 'Active'),
    ))
    .orderBy(asc(exerciseTable.pg.exerciseNumber));

  return {
    type: 'success' as const,
    unitResources,
    unitExercises,
  };
});
