import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  blogTable, InferSelectModel,
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

  // Get blog by slug and filter out unpublished ones
  const blog = await db.get(blogTable, { slug, publicationStatus: { '!=': 'Unpublished' } });

  return {
    type: 'success' as const,
    blog,
  };
});
