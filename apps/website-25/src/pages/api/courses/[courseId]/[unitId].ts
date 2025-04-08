import { z } from 'zod';
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
  }),
}, async (body, { raw }) => {
  const { courseId, unitId } = raw.req.query;
  const units = (await db.scan(unitTable, {
    filterByFormula: `{Course Record ID} = "${courseId}"`,
  })).sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

  return {
    type: 'success' as const,
    units,
    unit: units[Number(unitId) - 1],
  };
});
