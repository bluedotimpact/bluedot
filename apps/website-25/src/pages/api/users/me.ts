import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import {
  userTable,
  User,
} from '../../../lib/api/db/tables';

export type GetUserResponse = {
  type: 'success',
  user: User,
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

  if (!user) {
    // In practice we might want to create a user for them if this is the case
    throw new createHttpError.NotFound('User not found');
  }

  return {
    type: 'success' as const,
    user,
  };
});
