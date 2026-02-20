import { z } from 'zod';
import { jobPostingTable, type InferSelectModel } from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

type JobPosting = InferSelectModel<typeof jobPostingTable.pg>;

export type GetJobsResponse = {
  type: 'success';
  jobs: Omit<JobPosting, 'body'>[];
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    jobs: z.array(z.any()),
  }),
}, async () => {
  const allJobs = await db.scan(jobPostingTable);

  // Sort jobs:
  // 1. Published articles first (publicationStatus === 'Published')
  // 2. Within each group, sort by most recent publishedAt date
  const jobSummaries = allJobs
    .sort((a, b) => {
      // First, sort by publication status (Published first)
      const aIsPublished = a.publicationStatus === 'Published';
      const bIsPublished = b.publicationStatus === 'Published';

      if (aIsPublished && !bIsPublished) {
        return -1;
      }

      if (!aIsPublished && bIsPublished) {
        return 1;
      }

      // If both have the same publication status, sort by publishedAt date (most recent first)
      const aDate = a.publishedAt || 0;
      const bDate = b.publishedAt || 0;
      return bDate - aDate; // Descending order (most recent first)
    })
    .map(({ body, ...rest }) => rest);

  return {
    type: 'success' as const,
    jobs: jobSummaries,
  };
});
