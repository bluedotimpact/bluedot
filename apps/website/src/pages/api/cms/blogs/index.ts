import { z } from 'zod';
import {
  blogTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';

type CmsBlog = InferSelectModel<typeof blogTable.pg>;

export type GetBlogsResponse = {
  type: 'success',
  blogs: Omit<CmsBlog, 'body'>[],
};

export const getAllBlogs = async () => {
  const allBlogs = await db.scan(blogTable, { publicationStatus: 'Published' });

  // Sort by publishedAt descending and remove the body field from each blog to make the response lighter
  const blogSummaries = allBlogs
    .sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0))
    .map(({ body, ...rest }) => rest);

  return blogSummaries;
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    blogs: z.array(z.any()),
  }),
}, async () => {
  const blogs = await getAllBlogs();

  return {
    type: 'success' as const,
    blogs,
  };
});
