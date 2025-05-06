import { z } from 'zod';
import createHttpError from 'http-errors';
import { AirtableTsTable, formula } from 'airtable-ts-formula';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { Blog, blogTable } from '../../../../lib/api/db/tables';

export type GetBlogResponse = {
  type: 'success',
  blog: Blog,
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    body: z.string(),
  }).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    blog: z.any(),
  }),
}, async (body, { raw }) => {
  const { slug } = raw.req.query;
  if (typeof slug !== 'string') {
    throw new createHttpError.BadRequest('Invalid slug');
  }

  const blog = (await db.scan(blogTable, {
    // TODO: remove this unnecessary cast after we drop array support for mappings in airtable-ts
    filterByFormula: formula(await db.table(blogTable) as AirtableTsTable<Blog>, ['AND',
      ['=', { field: 'slug' }, slug],
    ]),
  }))[0];

  if (!blog) {
    throw new createHttpError.NotFound('Blog post not found');
  }

  switch (raw.req.method) {
    case 'GET': {
      return {
        type: 'success' as const,
        blog,
      };
    }
    case 'PUT': {
      if (!body) {
        throw new createHttpError.BadRequest('Expected PUT request to include body');
      }
      const updatedBlog = await db.update(blogTable, {
        id: blog.id,
        body: body.body,
      });
      return {
        type: 'success' as const,
        blog: updatedBlog,
      };
    }
    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
