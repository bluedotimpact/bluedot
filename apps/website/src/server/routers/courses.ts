import { unitTable } from '@bluedot/db';
import z from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const coursesRouter = router({
  getByUnitId: publicProcedure
    .input(
      z.object({
        courseSlug: z.string(),
        unitId: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const { courseSlug, unitId } = input;

      return db.get(unitTable, {
        id: unitId,
        courseSlug,
        unitStatus: 'Active',
      });
    }),
});
