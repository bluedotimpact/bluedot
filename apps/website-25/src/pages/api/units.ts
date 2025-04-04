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
  const testUnits = allUnits.filter((u) => u.courseTitle.includes('What the fish'));

  return {
    type: 'success' as const,
    units: testUnits,
  };
});
