import { z } from 'zod';
import createHttpError from 'http-errors';
import { jobPostingTable, type InferSelectModel } from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

type JobPosting = InferSelectModel<typeof jobPostingTable.pg>;

export type GetJobResponse = {
  type: 'success';
  job: JobPosting;
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

  const job = await db.get(jobPostingTable, { slug });

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

      await db.update(jobPostingTable, {
        id: job.id,
        body: body.body,
      });
      return {
        type: 'success' as const,
        job: {
          ...job,
          body: body.body,
        },
      };
    }

    case undefined:
    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
