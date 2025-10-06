import { z } from 'zod';
import { jobPostingTable } from '@bluedot/db';
import { publicProcedure, router } from '../trpc'; // Adjust path to your tRPC setup
import db from '../../lib/api/db';

export const jobsRouter = router({
  getJobs: publicProcedure
    .output(
      z.object({
        jobs: z.array(
          z.object({
            id: z.string(),
            slug: z.string(),
            title: z.string(),
            subtitle: z.string(),
            applicationUrl: z.nullable(z.string()),
            publicationStatus: z.nullable(z.string()),
            publishedAt: z.number(),
          }),
        ),
      }),
    )
    .query(async () => {
      const allJobs = await db.scan(jobPostingTable, {
        publicationStatus: 'Published',
      });

      // Sort jobs alphabetically by title and remove the body field
      // TODO: just fetch these fields from the DB in the first place
      const jobs = allJobs
        .sort((a, b) => a.title.localeCompare(b.title))
        .map(({ body, ...rest }) => rest);

      return {
        jobs,
      };
    }),
});
