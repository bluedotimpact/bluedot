import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  blogTable, Blog,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

export type GetBlogResponse = {
  type: 'success',
  blog: Blog,
};

export async function getBlogIfPublished(slug: string): Promise<Blog> {
  const blog = await db.get(blogTable, { slug, publicationStatus: { '!=': 'Unpublished' } });
  return blog;
}

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

  try {
    const blog = await getBlogIfPublished(slug);

    return {
      type: 'success' as const,
      blog,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching blog post:', slug, error);
    throw new createHttpError.NotFound('Blog post not found');
  }
});
