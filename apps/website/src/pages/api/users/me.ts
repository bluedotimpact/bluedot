import { z } from 'zod';
import createHttpError from 'http-errors';
import { userTable, User } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { meRequestBodySchema } from '../../../lib/schemas/user/me.schema';

export type GetUserResponse = {
  type: 'success';
  user: User;
  isNewUser: boolean;
};

export type PatchUserBody = {
  name?: string;
};

export type PostUserBody = {
  utmSource?: string;
  utmCampaign?: string;
  utmContent?: string;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: meRequestBodySchema,
  responseBody: z.object({
    type: z.literal('success'),
    user: z.any(),
    isNewUser: z.boolean(),
  }).optional(),
}, async (body, { auth, raw }) => {
  let existingUser: User | null;
  try {
    existingUser = await db.getFirst(userTable, {
      filter: { email: auth.email },
    });
  } catch (error) {
    throw new createHttpError.InternalServerError(
      process.env.NODE_ENV === 'production'
        ? 'Database error occurred'
        : `Database error occurred: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  switch (raw.req.method) {
    case 'POST':
    case 'GET': {
      let user: User;
      const isNewUser = !existingUser;
      if (!existingUser) {
        // Create user if doesn't exist
        const initialUtmSource = raw.req.method === 'POST' ? body?.initialUtmSource : undefined;
        const initialUtmCampaign = raw.req.method === 'POST' ? body?.initialUtmCampaign : undefined;
        const initialUtmContent = raw.req.method === 'POST' ? body?.initialUtmContent : undefined;

        user = await db.insert(userTable, {
          email: auth.email,
          lastSeenAt: new Date().toISOString(),
          ...(initialUtmSource && { utmSource: initialUtmSource }),
          ...(initialUtmCampaign && { utmCampaign: initialUtmCampaign }),
          ...(initialUtmContent && { utmContent: initialUtmContent }),
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
        isNewUser, // Include in response
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
      const updatedUser = await db.update(userTable, {
        id: existingUser.id,
        ...body,
      });

      return {
        type: 'success' as const,
        user: updatedUser,
        isNewUser: false,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
