import { z } from 'zod';
import createHttpError from 'http-errors';
import { sharedDemoOutputTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db, { demoTypes } from '../../../lib/api/db';

const SavedDemoOutputSchema = z.object({
  type: demoTypes,
  data: z.string().min(1).max(100_000),
});

export type SavedDemoOutput = z.infer<typeof SavedDemoOutputSchema>;

export default makeApiRoute({
  requireAuth: false,
  responseBody: SavedDemoOutputSchema,
}, async (body, { raw }) => {
  const { savedDemoOutputId } = raw.req.query;
  if (typeof savedDemoOutputId !== 'string' || !savedDemoOutputId) {
    throw new createHttpError.BadRequest('Missing savedDemoOutputId');
  }

  const record = await db.get(sharedDemoOutputTable, { id: savedDemoOutputId });

  return {
    type: record.type as SavedDemoOutput['type'],
    data: record.data ?? '',
  };
});
