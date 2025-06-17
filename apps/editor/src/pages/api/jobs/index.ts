import { z } from 'zod';
import { asc, jobPostingTable, InferSelectModel } from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

type JobPosting = InferSelectModel<typeof jobPostingTable.pg>;

export type GetJobsResponse = {
  type: 'success',
  jobs: Omit<JobPosting, 'body'>[],
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    jobs: z.array(z.any()),
  }),
}, async () => {
  const allJobs = await db.pg.select().from(jobPostingTable.pg).orderBy(asc(jobPostingTable.pg.title));

  // Remove the body field from each job to make the response lighter
  const jobSummaries = allJobs.map(({ body, ...rest }) => rest);

  return {
    type: 'success' as const,
    jobs: jobSummaries,
  };
});
