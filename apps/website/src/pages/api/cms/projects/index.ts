import { z } from 'zod';
import {
  projectTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

type CmsProject = InferSelectModel<typeof projectTable.pg>;

export type GetProjectsResponse = {
  type: 'success',
  projects: Omit<CmsProject, 'body'>[],
};

export const getAllPublishedProjects = async () => {
  const allProjects = await db.scan(projectTable, { publicationStatus: 'Published' });

  // Sort by publishedAt descending and remove the body field from each project to make the response lighter
  const projectSummaries = allProjects
    .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
    .map(({ body, ...rest }) => rest);

  return projectSummaries;
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    projects: z.array(z.any()),
  }),
}, async () => {
  const projects = await getAllPublishedProjects();

  return {
    type: 'success' as const,
    projects,
  };
});
