import { z } from 'zod';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { Unit, unitTable } from '../../../../lib/api/db/tables';

export type GetUnitResponse = {
  type: 'success',
  unit: Unit,
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    unit: z.any(),
  }),
}, async (body, { raw }) => {
  const { courseId, unitId } = raw.req.query;
  const unit = (await db.scan(unitTable, {
    filterByFormula: `AND({Course Record ID} = "${courseId}", {Unit number} = "${unitId}")`,
  }))[0];

  return {
    type: 'success' as const,
    unit,
  };
});
