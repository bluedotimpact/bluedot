import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  exerciseTable, unitResourceTable, unitTable, InferSelectModel,
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
  const { courseSlug, unitNumber } = raw.req.query;
  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }
  if (typeof unitNumber !== 'string') {
    throw new createHttpError.BadRequest('Invalid unit number');
  }

  const unit = await db.get(unitTable, { courseSlug, unitNumber, unitStatus: 'Active' });

  // Get unit resources and filter for Core/Further, then sort
  const allUnitResources = await db.scan(unitResourceTable, { unitId: unit.id });
  const unitResources = allUnitResources
    .filter((resource) => resource.coreFurtherMaybe === 'Core' || resource.coreFurtherMaybe === 'Further')
    .sort((a, b) => {
      const isCoreA = a.coreFurtherMaybe === 'Core' ? 1 : 0;
      const isCoreB = b.coreFurtherMaybe === 'Core' ? 1 : 0;
      if (isCoreA !== isCoreB) {
        return isCoreB - isCoreA;
      }
      const orderA = a.readingOrder ? parseInt(a.readingOrder) : Infinity;
      const orderB = b.readingOrder ? parseInt(b.readingOrder) : Infinity;
      return orderA - orderB;
    });

  // Get unit exercises with active status and sort by exercise number
  const allUnitExercises = await db.scan(exerciseTable, { unitId: unit.id, status: 'Active' });
  const unitExercises = allUnitExercises.sort((a, b) => (a.exerciseNumber || '').localeCompare(b.exerciseNumber || ''));

  return {
    type: 'success' as const,
    unitResources,
    unitExercises,
  };
});
