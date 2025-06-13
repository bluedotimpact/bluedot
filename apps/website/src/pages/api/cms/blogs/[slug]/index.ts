import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula } from 'airtable-ts-formula';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import { CmsBlog, cmsBlogTable } from '../../../../../lib/api/db/tables';

export type GetBlogResponse = {
  type: 'success',
  blog: CmsBlog,
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    blog: z.any(),
  }),
}, async (body, { raw }) => {
  const { slug } = raw.req.query;
  if (typeof slug !== 'string') {
    throw new createHttpError.BadRequest('Invalid slug');
  }

  const blog = (await db.scan(cmsBlogTable, {
    filterByFormula: formula(await db.table(cmsBlogTable), ['AND',
      ['!=', { field: 'publicationStatus' }, 'Unpublished'],
      ['=', { field: 'slug' }, slug],
    ]),
  }))[0];

  if (!blog) {
    throw new createHttpError.NotFound('Blog post not found');
  }

  return {
    type: 'success' as const,
    blog,
  };
});
