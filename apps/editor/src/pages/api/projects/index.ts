import { z } from 'zod';
import { projectTable, type InferSelectModel } from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

type Project = InferSelectModel<typeof projectTable.pg>;

export type GetProjectsResponse = {
  type: 'success';
  projects: Omit<Project, 'body'>[];
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    projects: z.array(z.any()),
  }),
}, async () => {
  const allProjects = await db.scan(projectTable);

  // Sort by title ascending and remove the body field from each project to make the response lighter
  const projectSummaries = allProjects
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    .map(({ body, ...rest }) => rest);

  return {
    type: 'success' as const,
    projects: projectSummaries,
  };
});
