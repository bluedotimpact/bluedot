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
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    .map(({ body: _, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars

  return {
    type: 'success' as const,
    projects: projectSummaries,
  };
});
