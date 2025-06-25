import { z } from 'zod';
import { jobPostingTable, InferSelectModel } from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

type CmsJobPosting = InferSelectModel<typeof jobPostingTable.pg>;

export type GetJobsResponse = {
  type: 'success',
  jobs: Omit<CmsJobPosting, 'body'>[],
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    jobs: z.array(z.any()),
  }),
}, async () => {
  const allJobs = await db.scan(jobPostingTable, { publicationStatus: 'Published' });

  // Sort jobs alphabetically by title and remove the body field from each job to make the response lighter
  const jobSummaries = allJobs
    .sort((a, b) => (a.title).localeCompare(b.title))
    .map(({ body, ...rest }) => rest);

  return {
    type: 'success' as const,
    jobs: jobSummaries,
  };
});
