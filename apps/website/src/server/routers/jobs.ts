import { jobPostingTable } from '@bluedot/db';
import { publicProcedure, router } from '../trpc';
import db from '../../lib/api/db';

export const jobsRouter = router({
  getAll: publicProcedure
    .query(async () => {
      const allJobs = await db.scan(jobPostingTable, {
        publicationStatus: 'Published',
      });

      // Sort by Airtable Prio (e.g. "1 Top", "2 Med", "3 Low"), then title.
      // Jobs without a priority sort to the bottom.
      return allJobs
        .sort((a, b) => {
          const pa = a.priority ?? '￿';
          const pb = b.priority ?? '￿';
          if (pa !== pb) return pa.localeCompare(pb);
          return (a.title ?? '').localeCompare(b.title ?? '');
        })
        .map(({ body, ...rest }) => rest);
    }),
});
