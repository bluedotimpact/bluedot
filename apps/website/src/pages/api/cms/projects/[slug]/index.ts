import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  projectTable, InferSelectModel,
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

  // Get project by slug and filter out unpublished ones
  const project = await db.get(projectTable, { slug, publicationStatus: { '!=': 'Unpublished' } });

  return {
    type: 'success' as const,
    project,
  };
});
