import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  projectTable, Project,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

export type GetProjectResponse = {
  type: 'success',
  project: Project,
};

export async function getProjectIfPublished(slug: string): Promise<Project> {
  const project = await db.get(projectTable, { slug, publicationStatus: { '!=': 'Unpublished' } });
  return project;
}

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

  const project = await getProjectIfPublished(slug);

  return {
    type: 'success' as const,
    project,
  };
});
