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

export type PutUserRequest = {
  user: User;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    user: z.any(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
    user: z.any(),
  }),
}, async (body, { raw, auth }) => {
  const user = (await db.scan(userTable, {
    filterByFormula: `{Email} = "${auth.email}"`,
  }))[0];

  switch (raw.req.method) {
    case 'GET': {
      if (!user) {
        throw new createHttpError.NotFound('User not found');
      }

      const courseNames = user.courseSitesVisited.split(',') ?? [];
      if (courseNames.length > 1) {
        // eslint-disable-next-line no-console
        console.error('Users with multiple courses are not supported yet, only returning the first coursePath');
      }
    
      const course = (await db.scan(courseTable, {
        filterByFormula: `{Course} = "${courseNames[0]}"`,
      }))[0];
    
      return {
        type: 'success' as const,
        user: { ...user, coursePath: course?.path ?? '' },
      };
    }

    case 'PUT': {
      if (user) {
        throw new createHttpError.Conflict('User already exists');
      }

      const newUser = await db.insert(userTable, {
        ...body.user,
        email: auth.email,
      });

      return {
        type: 'success' as const,
        user: newUser,
      };
    }

    default:
      throw new createHttpError.MethodNotAllowed(`Method ${raw.req.method} not allowed`);
  }
});
