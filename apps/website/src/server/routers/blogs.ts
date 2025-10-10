import { blogTable } from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const getAllPublishedBlogs = async () => {
  const publishedBlogs = await db.scan(blogTable, { publicationStatus: 'Published' });

  // Sort by publishedAt descending and remove the body field from each blog to make the response lighter
  return publishedBlogs
    .sort((a, b) => {
      if (a.isFeatured !== b.isFeatured) {
        return b.isFeatured ? 1 : -1;
      }
      return (b.publishedAt || 0) - (a.publishedAt || 0);
    })
    .map(({ body, ...rest }) => rest);
};

export const blogsRouter = router({
  getBlogs: publicProcedure.query(async () => {
    return getAllPublishedBlogs();
  }),
});
