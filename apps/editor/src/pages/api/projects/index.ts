import { z } from 'zod';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { Project, projectTable } from '../../../lib/api/db/tables';

export type GetProjectsResponse = {
  type: 'success',
  projects: Omit<Project, 'body'>[],
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    projects: z.array(z.any()),
  }),
}, async () => {
  const allProjects = await db.scan(projectTable);

  // Sort projects alphabetically by title
  const sortedProjects = allProjects.sort((a, b) => a.title.localeCompare(b.title));

  // Remove the body field from each project to make the response lighter
  const projectSummaries = sortedProjects.map(({ body, ...rest }) => rest);

  return {
    type: 'success' as const,
    projects: projectSummaries,
  };
});
