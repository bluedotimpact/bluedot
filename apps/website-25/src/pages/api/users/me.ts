import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import {
  userTable,
  User,
  courseTable,
} from '../../../lib/api/db/tables';

export type GetUserResponse = {
  type: 'success';
  user: User & { coursePath: string };
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    user: z.any(),
  }),
}, async (body, { auth }) => {
  const user = (await db.scan(userTable, {
    filterByFormula: `{Email} = "${auth.email}"`,
  }))[0];

  const courseNames = user?.courseSitesVisited.split(',') ?? [];

  if (courseNames.length > 1) {
    console.error('Users with multiple courses are not supported yet, only returning the first coursePath');
  }

  const course = (await db.scan(courseTable, {
    filterByFormula: `{Course} = "${courseNames[0]}"`,
  }))[0];

  if (!user) {
    // In practice we might want to create a user for them if this is the case
    throw new createHttpError.NotFound('User not found');
  }

  const res: GetUserResponse = {
    type: 'success' as const,
    user: { ...user, coursePath: course?.path ?? '' },
  };

  return res;
});
