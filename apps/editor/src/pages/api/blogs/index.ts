import { z } from 'zod';
import { desc, blogTable, InferSelectModel } from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

type Blog = InferSelectModel<typeof blogTable.pg>;

export type GetBlogsResponse = {
  type: 'success',
  blogs: Omit<Blog, 'body'>[],
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    blogs: z.array(z.any()),
  }),
}, async () => {
  const allBlogs = await db.pg.select().from(blogTable.pg).orderBy(desc(blogTable.pg.publishedAt));

  // Remove the body field from each blog to make the response lighter
  const blogSummaries = allBlogs.map(({ body, ...rest }) => rest);

  return {
    type: 'success' as const,
    blogs: blogSummaries,
  };
});
