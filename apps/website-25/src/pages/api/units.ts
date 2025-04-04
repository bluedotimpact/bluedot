import { z } from 'zod';
import db from '../../lib/api/db';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { Unit, unitTable } from '../../lib/api/db/tables';

export type GetUnitResponse = {
  type: 'success',
  units: Unit[],
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    units: z.array(z.any()),
  }),
}, async () => {
  const allUnits = await db.scan(unitTable);
  // how do we use params arg to filter by course and/or unit for more performant fetching?

  return {
    type: 'success' as const,
    units: allUnits,
  };
});
