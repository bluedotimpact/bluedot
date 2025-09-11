import { z } from 'zod';
import * as createHttpError from 'http-errors';
import { syncRequestsTable, gte, desc } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { checkAdminAccess } from './request-sync';

const syncRequestSchema = z.object({
  id: z.number(),
  requestedBy: z.string(),
  status: z.enum(['queued', 'running', 'completed']),
  requestedAt: z.date(),
  startedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
});

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({}).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    requests: z.array(syncRequestSchema),
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
