import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db, { demoTypes, sharedDemoOutputTable } from '../../../lib/api/db';

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: demoTypes,
    data: z.string().min(1).max(100_000),
  }),
}, async (body, { raw }) => {
  const { shareId } = raw.req.query;
  if (typeof shareId !== 'string' || !shareId) {
    throw new createHttpError.BadRequest('Missing shareId');
  }

  const record = await db.get(sharedDemoOutputTable, shareId);

  return {
    type: record.type,
    data: record.data,
  };
});
