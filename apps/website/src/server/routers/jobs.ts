import { jobPostingTable } from '@bluedot/db';
import { publicProcedure, router } from '../trpc';
import db from '../../lib/api/db';

export const jobsRouter = router({
  getAll: publicProcedure
    .query(async () => {
      const allJobs = await db.scan(jobPostingTable, {
        publicationStatus: 'Published',
      });

      // Sort jobs alphabetically by title and remove the body field
      // TODO: just fetch these fields from the DB in the first place
      return allJobs
        .sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
        .map(({ body, ...rest }) => rest);
    }),
});
