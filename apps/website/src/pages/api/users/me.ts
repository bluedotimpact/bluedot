import { z } from 'zod';
import createHttpError from 'http-errors';
import { eq, userTable, InferSelectModel } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { meRequestBodySchema } from '../../../lib/schemas/user/me.schema';

type User = InferSelectModel<typeof userTable.pg>;

export type GetUserResponse = {
  type: 'success';
  user: User;
};

export type PatchUserBody = {
  name?: string;
  referredById?: string;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: meRequestBodySchema,
  responseBody: z.object({
    type: z.literal('success'),
    user: z.any(),
  }).optional(),
}, async (body, { auth, raw }) => {
  const existingUsers = await db.pg.select()
    .from(userTable.pg)
    .where(eq(userTable.pg.email, auth.email));

  const existingUser = existingUsers[0];

  switch (raw.req.method) {
    case 'GET': {
      let user: User;
      if (!existingUser) {
        // Create user if doesn't exist
        user = await db.airtableInsert(userTable, {
          email: auth.email,
          lastSeenAt: new Date().toISOString(),
        });
      } else {
        // Update last seen timestamp if does exist
        user = await db.airtableUpdate(userTable, {
          id: existingUser.id,
          lastSeenAt: new Date().toISOString(),
        });
      }

      return {
        type: 'success' as const,
        user,
      };
    }

    case 'PATCH': {
      if (!existingUser) {
        throw new createHttpError.NotFound('User not found');
      }

      if (!body) {
        throw new createHttpError.BadRequest('PATCH request requires a body');
      }

      // Validate that at least one field is being updated
      const hasUpdates = Object.values(body).some((value) => value !== undefined && value !== null);
      if (!hasUpdates) {
        throw new createHttpError.BadRequest('At least one field must be provided for update');
      }

      // Update user with provided fields
      const updatedUser = await db.airtableUpdate(userTable, {
        id: existingUser.id,
        ...body,
      });

      return {
        type: 'success' as const,
        user: updatedUser,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
