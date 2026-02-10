import { z } from 'zod';
import { blogTable, type InferSelectModel } from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

type Blog = InferSelectModel<typeof blogTable.pg>;

export type GetBlogsResponse = {
  type: 'success';
  blogs: Omit<Blog, 'body'>[];
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    blogs: z.array(z.any()),
  }),
}, async () => {
  const allBlogs = await db.scan(blogTable);

  // Sort by publishedAt descending and remove the body field from each blog to make the response lighter
  const blogSummaries = allBlogs
    .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
    .map(({ body: _, ...rest }) => rest); // eslint-disable-line @typescript-eslint/no-unused-vars

  return {
    type: 'success' as const,
    blogs: blogSummaries,
  };
});
