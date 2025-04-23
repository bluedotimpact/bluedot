import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { formConfigurationTable } from '../../../lib/api/db/tables';

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
  const records = await db.scan(formConfigurationTable);
  const targetRecord = records.find((record) => record.Slug === raw.req.query.slug);

  if (!targetRecord) {
    throw new createHttpError.NotFound('Form not found');
  }

  return {
    type: 'success' as const,
    title: targetRecord.Title || 'Unnamed form', // Title for the page
    minimumLength: targetRecord['Minimum length'] ?? 90, // Min required time for form validation
  };
});
