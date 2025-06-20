import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, ne, jobPostingTable, InferSelectModel,
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

  const jobs = await db.pg.select()
    .from(jobPostingTable.pg)
    .where(and(
      ne(jobPostingTable.pg.publicationStatus, 'Unpublished'),
      eq(jobPostingTable.pg.slug, slug),
    ));

  const job = jobs[0];

  if (!job) {
    throw new createHttpError.NotFound('Job posting not found');
  }

  return {
    type: 'success' as const,
    job,
  };
});
