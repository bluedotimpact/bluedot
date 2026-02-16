import { z } from 'zod';
import createHttpError from 'http-errors';
import { projectTable, type InferSelectModel } from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

type Project = InferSelectModel<typeof projectTable.pg>;

export type GetProjectResponse = {
  type: 'success';
  project: Project;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    body: z.string(),
  }).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    project: z.any(),
  }),
}, async (body, { raw }) => {
  const { slug } = raw.req.query;
  if (typeof slug !== 'string') {
    throw new createHttpError.BadRequest('Invalid slug');
  }

  const project = await db.get(projectTable, { slug });

  switch (raw.req.method) {
    case 'GET': {
      return {
        type: 'success' as const,
        project,
      };
    }

    case 'PUT': {
      if (!body) {
        throw new createHttpError.BadRequest('Expected PUT request to include body');
      }

      await db.update(projectTable, {
        id: project.id,
        body: body.body,
      });
      return {
        type: 'success' as const,
        project: {
          ...project,
          body: body.body,
        },
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
