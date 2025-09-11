import { z } from 'zod';
import * as createHttpError from 'http-errors';
import { syncRequestsTable, gte, desc } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { checkAdminAccess } from './request-sync';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({}).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    requests: z.array(z.any()),
  }),
}, async (body, { auth, raw }) => {
  if (raw.req.method !== 'GET') {
    throw new createHttpError.MethodNotAllowed();
  }

  const hasAccess = await checkAdminAccess(auth.email);
  
  if (!hasAccess) {
    throw new createHttpError.Forbidden('Unauthorized');
  }
  
  // Get last 24 hours of requests, newest first
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
  
  const requests = await db.pg.select()
    .from(syncRequestsTable)
    .where(gte(syncRequestsTable.requestedAt, twentyFourHoursAgo))
    .orderBy(desc(syncRequestsTable.requestedAt));
  
  return {
    type: 'success' as const,
    requests,
  };
});