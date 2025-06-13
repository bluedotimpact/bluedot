import { z } from 'zod';
import createHttpError from 'http-errors';
import { AirtableTsTable, formula } from 'airtable-ts-formula';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import { CmsProject, cmsProjectTable } from '../../../../../lib/api/db/tables';

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

  const project = (await db.scan(cmsProjectTable, {
    // TODO: remove this unnecessary cast after we drop array support for mappings in airtable-ts
    filterByFormula: formula(await db.table(cmsProjectTable) as AirtableTsTable<CmsProject>, ['AND',
      ['!=', { field: 'publicationStatus' }, 'Unpublished'],
      ['=', { field: 'slug' }, slug],
    ]),
  }))[0];

  if (!project) {
    throw new createHttpError.NotFound('Project post not found');
  }

  return {
    type: 'success' as const,
    project,
  };
});
