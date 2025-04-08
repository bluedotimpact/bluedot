import { z } from 'zod';
import createHttpError from 'http-errors';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { Unit, unitTable } from '../../../../lib/api/db/tables';

export type GetUnitResponse = {
  type: 'success',
  units: Unit[],
  unit: Unit,
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    units: z.array(z.any()),
    unit: z.any(),
  }),
}, async (body, { raw }) => {
  const { courseSlug, unitId } = raw.req.query;
  const units = (await db.scan(unitTable, {
    filterByFormula: `{[>] Course slug} = "${courseSlug}"`,
  })).sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  const unit = units.find((u) => u.unitNumber === unitId);

  if (!unit) {
    throw new createHttpError.NotFound('Unit not found');
  }

  return {
    type: 'success' as const,
    units,
    unit,
  };
});
