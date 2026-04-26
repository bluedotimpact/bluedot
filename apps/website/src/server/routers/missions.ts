import { missionTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const getAllLiveMissions = async () => {
  const allMissions = await db.scan(missionTable, { status: 'Live' });

  return allMissions
    .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
    .map(({ description, ...rest }) => rest);
};

export const missionsRouter = router({
  getAll: publicProcedure.query(async () => {
    return getAllLiveMissions();
  }),
});
