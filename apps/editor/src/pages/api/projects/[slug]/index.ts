import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula, AirtableTsTable } from 'airtable-ts-formula';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { Project, projectTable } from '../../../../lib/api/db/tables';

export type GetProjectResponse = {
  type: 'success',
  project: Project,
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    body: z.string(),
  }).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    project: z.any(),
  }),
}, async (body, { raw }) => {
  const { slug } = raw.req.query;
  if (typeof slug !== 'string') {
    throw new createHttpError.BadRequest('Invalid slug');
  }

  const project = (await db.scan(projectTable, {
    // TODO: remove this unnecessary cast after we drop array support for mappings in airtable-ts
    filterByFormula: formula(await db.table(projectTable) as AirtableTsTable<Project>, [
      'AND',
      ['=', { field: 'slug' }, slug],
    ]),
  }))[0];

  if (!project) {
    throw new createHttpError.NotFound('Project posting not found');
  }

  switch (raw.req.method) {
    case 'GET': {
      return {
        type: 'success' as const,
        project,
      };
    }
    case 'PUT': {
      if (!body) {
        throw new createHttpError.BadRequest('Expected PUT request to include body');
      }
      const updatedProject = await db.update(projectTable, {
        id: project.id,
        body: body.body,
      });
      return {
        type: 'success' as const,
        blog: updatedProject,
      };
    }
    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
