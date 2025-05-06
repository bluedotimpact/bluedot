import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula } from 'airtable-ts-formula';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { JobPosting, jobPostingtable } from '../../../../lib/api/db/tables';

export type GetJobResponse = {
  type: 'success',
  job: JobPosting,
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

  const job = (await db.scan(jobPostingtable, {
    filterByFormula: formula(await db.table(jobPostingtable), [
      'AND',
      ['=', { field: 'slug' }, slug],
    ]),
  }))[0];

  if (!job) {
    throw new createHttpError.NotFound('Job posting not found');
  }

  return {
    type: 'success' as const,
    job,
  };
});
