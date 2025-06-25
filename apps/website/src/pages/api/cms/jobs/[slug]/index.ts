import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  jobPostingTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type CmsJobPosting = InferSelectModel<typeof jobPostingTable.pg>;

export type GetJobResponse = {
  type: 'success',
  job: CmsJobPosting,
};

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

  // Get job by slug and filter out unpublished ones
  const job = await db.get(jobPostingTable, { slug, publicationStatus: { '!=': 'Unpublished' } });

  return {
    type: 'success' as const,
    job,
  };
});
