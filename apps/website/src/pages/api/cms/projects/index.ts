import { z } from 'zod';
import {
  eq, desc, projectTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

type CmsProject = InferSelectModel<typeof projectTable.pg>;

export type GetProjectsResponse = {
  type: 'success',
  projects: Omit<CmsProject, 'body'>[],
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    projects: z.array(z.any()),
  }),
}, async () => {
  const allProjects = await db.pg.select()
    .from(projectTable.pg)
    .where(eq(projectTable.pg.publicationStatus, 'Published'))
    .orderBy(desc(projectTable.pg.publishedAt));

  // Remove the body field from each project to make the response lighter
  const projectSummaries = allProjects.map(({ body, ...rest }) => rest);

  return {
    type: 'success' as const,
    projects: projectSummaries,
  };
});
