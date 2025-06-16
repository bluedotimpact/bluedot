import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula } from 'airtable-ts-formula';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import {
  userTable,
  User,
} from '../../../lib/api/db/tables';

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
  requestBody: z.object({
    name: z.string()
      .trim()
      .min(1, 'Name cannot be empty')
      // 50 characters for a name seemed reasonable
      .max(50, 'Name must be under 50 characters')
      .regex(/^[\p{L}\s\-'.]+$/u, 'Name can only contain letters, spaces, hyphens, apostrophes, and periods')
      .optional(),
    referredById: z.string()
      .trim()
      .min(1, 'Referral ID cannot be empty')
      .optional(),
  }).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    user: z.any(),
  }).optional(),
}, async (body, { auth, raw }) => {
  const existingUser = (await db.scan(userTable, {
    filterByFormula: formula(await db.table(userTable), [
      '=',
      { field: 'email' },
      auth.email,
    ]),
  }))[0];

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
      if (Object.keys(body).length === 0) {
        throw new createHttpError.BadRequest('At least one field must be provided for update');
      }

      // Update user with provided fields
      const updatedUser = await db.update(userTable, {
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
