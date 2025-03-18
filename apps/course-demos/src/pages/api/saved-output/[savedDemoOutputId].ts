import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db, { demoTypes, sharedDemoOutputTable } from '../../../lib/api/db';

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

  const record = await db.get(sharedDemoOutputTable, savedDemoOutputId);

  return {
    type: record.type,
    data: record.data,
  };
});
