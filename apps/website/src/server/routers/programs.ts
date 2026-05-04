import { programTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const getAllActivePrograms = async () => {
  const programs = await db.scan(programTable, { status: 'Active' });

  return programs.sort((a, b) => Number(a.order) - Number(b.order));
};

export const programsRouter = router({
  getAll: publicProcedure.query(async () => {
    return getAllActivePrograms();
  }),
});
