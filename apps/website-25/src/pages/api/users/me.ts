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
  user: User;
  enrolledCourses: { id: string, title: string, path: string }[];
};

export type PatchUserBody = {
  name?: string;
  referredById?: string;
  courseSitesVisitedCsv?: string;
  completedMoocAt?: number;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    name: z.string().optional(),
    referredById: z.string().optional(),
    courseSitesVisited: z.string().optional(),
    completedMoocAt: z.number().optional(),
  }).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    user: z.any(),
    enrolledCourses: z.array(z.object({
      title: z.string(),
      path: z.string(),
    })),
  }).optional(),
}, async (body, { auth, raw }) => {
  // Handle GET request
  const [existingUser] = await db.scan(userTable, {
    filterByFormula: `{Email} = "${auth.email}"`,
  });

  switch (raw.req.method) {
    case 'GET': {
      let user: User;
      if (!existingUser) {
        // Create user if doesn't exist
        user = await db.insert(userTable, {
          email: auth.email,
          lastSeenAt: new Date().toISOString(),
        });
      } else {
        // Update last seen timestamp if does exist
        user = await db.update(userTable, {
          id: existingUser.id,
          lastSeenAt: new Date().toISOString(),
        });
      }

      const courseNames = user.courseSitesVisitedCsv.split(',');
      const courses = (await Promise.all(
        courseNames.map((courseName) => db.scan(courseTable, {
          filterByFormula: `{Course} = "${courseName}"`,
        })),
      )).flat();

      return {
        type: 'success' as const,
        user,
        enrolledCourses: courses.map((c) => ({ id: c.id, title: c.title, path: c.path })),
      };
    }

    case 'PATCH': {
      if (!existingUser) {
        throw new createHttpError.NotFound('User not found');
      }

      if (!body) {
        throw new createHttpError.BadRequest('PATCH request requires a body');
      }

      // Update user with provided fields
      await db.update(userTable, {
        id: existingUser.id,
        ...body,
      });

      return undefined;
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
