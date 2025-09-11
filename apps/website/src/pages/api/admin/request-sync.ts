import { z } from 'zod';
import * as createHttpError from 'http-errors';
import {
  syncRequestsTable,
  adminUsersTable,
  eq,
} from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';

export const checkAdminAccess = async (email: string): Promise<boolean> => {
  try {
    const admin = await db.pg.select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.email, email))
      .limit(1);

    return admin.length > 0;
  } catch {
    return false;
  }
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({}).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    requestId: z.number(),
  }),
}, async (body, { auth, raw }) => {
  if (raw.req.method !== 'POST') {
    throw new createHttpError.MethodNotAllowed();
  }

  const hasAccess = await checkAdminAccess(auth.email);

  if (!hasAccess) {
    throw new createHttpError.Forbidden('Unauthorized');
  }

  const syncRequestResult = await db.pg.insert(syncRequestsTable).values({
    requestedBy: auth.email,
    status: 'queued',
  }).returning();

  if (!syncRequestResult?.[0]?.id) {
    throw new createHttpError.InternalServerError('Failed to create sync request');
  }

  return {
    type: 'success' as const,
    requestId: syncRequestResult[0].id,
  };
});
