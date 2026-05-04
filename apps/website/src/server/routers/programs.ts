import { programTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

const getSortOrder = (value: string | null | undefined) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.POSITIVE_INFINITY;
};

export const getAllActivePrograms = async () => {
  const programs = await db.scan(programTable, { status: 'Active' });

  return programs.sort((a, b) => getSortOrder(a.order) - getSortOrder(b.order));
};

export const programsRouter = router({
  getAll: publicProcedure.query(async () => {
    return getAllActivePrograms();
  }),
});
