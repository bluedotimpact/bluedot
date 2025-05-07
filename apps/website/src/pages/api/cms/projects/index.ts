import { z } from 'zod';
import { AirtableTsTable, formula } from 'airtable-ts-formula';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { CmsProject, cmsProjectTable } from '../../../../lib/api/db/tables';

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
  const allProjects = await db.scan(cmsProjectTable, {
    // TODO: remove this unnecessary cast after we drop array support for mappings in airtable-ts
    filterByFormula: formula(await db.table(cmsProjectTable) as AirtableTsTable<CmsProject>, ['=', { field: 'publicationStatus' }, 'Published']),
  });

  // Sort projects by publishedAt date in descending order (newest first)
  const sortedProjects = allProjects.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Remove the body field from each project to make the response lighter
  const projectSummaries = sortedProjects.map(({ body, ...rest }) => rest);

  return {
    type: 'success' as const,
    projects: projectSummaries,
  };
});
