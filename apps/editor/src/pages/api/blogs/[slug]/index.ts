import { z } from 'zod';
import createHttpError from 'http-errors';
import { blogTable, type InferSelectModel } from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

type Blog = InferSelectModel<typeof blogTable.pg>;

export type GetBlogResponse = {
  type: 'success';
  blog: Blog;
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

  const blog = await db.get(blogTable, { slug });

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

      await db.update(blogTable, {
        id: blog.id,
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
