import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  jobPostingTable, JobPosting,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

export type GetJobResponse = {
  type: 'success',
  job: JobPosting,
};

export async function getJobIfPublished(slug: string): Promise<JobPosting> {
  const job = await db.get(jobPostingTable, { slug, publicationStatus: { '!=': 'Unpublished' } });
  return job;
}

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    job: z.any(),
  }),
}, async (body, { raw }) => {
  const { slug } = raw.req.query;
  if (typeof slug !== 'string') {
    throw new createHttpError.BadRequest('Invalid slug');
  }

  try {
    const job = await getJobIfPublished(slug);

    return {
      type: 'success' as const,
      job,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching job listing:', slug, error);
    throw new createHttpError.NotFound('Job listing not found');
  }
});
