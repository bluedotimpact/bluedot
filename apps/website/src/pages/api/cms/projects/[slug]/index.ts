import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, ne, projectTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type CmsProject = InferSelectModel<typeof projectTable.pg>;

export type GetProjectResponse = {
  type: 'success',
  project: CmsProject,
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    project: z.any(),
  }),
}, async (body, { raw }) => {
  const { slug } = raw.req.query;
  if (typeof slug !== 'string') {
    throw new createHttpError.BadRequest('Invalid slug');
  }

  const projects = await db.pg.select()
    .from(projectTable.pg)
    .where(and(
      ne(projectTable.pg.publicationStatus, 'Unpublished'),
      eq(projectTable.pg.slug, slug),
    ));

  const project = projects[0];

  if (!project) {
    throw new createHttpError.NotFound('Project post not found');
  }

  return {
    type: 'success' as const,
    project,
  };
});
