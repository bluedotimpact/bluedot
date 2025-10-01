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
  // Get blog by slug and filter out unpublished ones
  const blog = await db.get(blogTable, { slug, publicationStatus: { '!=': 'Unpublished' } });

  if (!blog) {
    throw new createHttpError.NotFound(`Blog not found: ${slug}`);
  }

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

  const blog = await getBlogIfPublished(slug);

  return {
    type: 'success' as const,
    blog,
  };
});
