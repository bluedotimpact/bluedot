import { z } from 'zod';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { Blog, blogTable } from '../../../lib/api/db/tables';

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
  const allBlogs = await db.scan(blogTable);

  // Sort blogs by publishedAt date in descending order (newest first)
  const sortedBlogs = allBlogs.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });

  // Remove the body field from each blog to make the response lighter
  const blogSummaries = sortedBlogs.map(({ body, ...rest }) => rest);

  return {
    type: 'success' as const,
    blogs: blogSummaries,
  };
});
