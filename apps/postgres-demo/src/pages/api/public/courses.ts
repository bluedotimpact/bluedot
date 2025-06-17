import { z } from 'zod';
import { courseTable } from '@bluedot/db';

import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { db } from '../../../lib/api/db';

export const CourseSchema = z.object({
  id: z.string(),
  title: z.string().nullable(),
  slug: z.string().nullable(),
});

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.array(CourseSchema),
}, async () => {
  return db.pg.select().from(courseTable.pg);
});
