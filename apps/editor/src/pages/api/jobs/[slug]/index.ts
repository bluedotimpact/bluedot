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
  requireAuth: true,
  requestBody: z.object({
    body: z.string(),
  }).optional(),
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

  switch (raw.req.method) {
    case 'GET': {
      return {
        type: 'success' as const,
        job,
      };
    }
    case 'PUT': {
      if (!body) {
        throw new createHttpError.BadRequest('Expected PUT request to include body');
      }
      const updatedJob = await db.update(jobPostingtable, {
        id: job.id,
        body: body.body,
      });
      return {
        type: 'success' as const,
        blog: updatedJob,
      };
    }
    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
