import { z } from 'zod';
import { sharedDemoOutputTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db, { demoTypes } from '../../../lib/api/db';

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    type: demoTypes,
    data: z.string().min(1).max(100_000),
  }),
  responseBody: z.object({
    savedDemoOutputId: z.string(),
  }),
}, async (body) => {
  const record = await db.airtableInsert(sharedDemoOutputTable, {
    type: body.type,
    data: body.data,
    createdAt: Math.floor(Date.now() / 1000),
  });

  return {
    savedDemoOutputId: record.id,
  };
});
