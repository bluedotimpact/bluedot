import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, ne, blogTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type CmsBlog = InferSelectModel<typeof blogTable.pg>;

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

  const blogs = await db.pg.select()
    .from(blogTable.pg)
    .where(and(
      ne(blogTable.pg.publicationStatus, 'Unpublished'),
      eq(blogTable.pg.slug, slug),
    ));

  const blog = blogs[0];

  if (!blog) {
    throw new createHttpError.NotFound('Blog post not found');
  }

  return {
    type: 'success' as const,
    blog,
  };
});
