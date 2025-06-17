import { z } from 'zod';
import createHttpError from 'http-errors';
import { eq, sharedDemoOutputTable } from '@bluedot/db';
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

  const records = await db.pg.select().from(sharedDemoOutputTable.pg).where(eq(sharedDemoOutputTable.pg.id, savedDemoOutputId));
  const record = records[0];

  if (!record) {
    throw new createHttpError.NotFound('Saved demo output not found');
  }

  return {
    type: (record.type || 'generate-react-component') as SavedDemoOutput['type'],
    data: record.data || '',
  };
});
