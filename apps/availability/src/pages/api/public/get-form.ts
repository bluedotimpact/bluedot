import { z } from 'zod';
import createHttpError from 'http-errors';
import { eq, formConfigurationTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';

export type GetFormResponse = {
  type: 'success',
  title: string,
  minimumLength: number,
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    title: z.string(),
    minimumLength: z.number(),
  }),
}, async (body, { raw }) => {
  const records = await db.pg.select().from(formConfigurationTable.pg).where(eq(formConfigurationTable.pg.slug, raw.req.query.slug as string));
  const targetRecord = records[0];

  if (!targetRecord) {
    throw new createHttpError.NotFound('Form not found');
  }

  return {
    type: 'success' as const,
    title: targetRecord.title || 'Unnamed form', // Title for the page
    minimumLength: targetRecord.minimumLength ?? 90, // Min required time for form validation
  };
});
