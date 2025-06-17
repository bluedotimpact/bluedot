import { z } from 'zod';
import createHttpError from 'http-errors';
import { eq, blogTable, InferSelectModel } from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

type Blog = InferSelectModel<typeof blogTable.pg>;

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

  const blogs = await db.pg.select().from(blogTable.pg).where(eq(blogTable.pg.slug, slug));
  const blog = blogs[0];

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
      await db.airtableUpdate(blogTable, {
        id: blog.id!,
        body: body.body,
      });
      return {
        type: 'success' as const,
        blog: {
          ...blog,
          body: body.body,
        },
      };
    }
    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
