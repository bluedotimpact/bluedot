import { z } from 'zod';
import { formConfigurationTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';

export type GetFormResponse = {
  type: 'success';
  title: string;
  minimumLength: number;
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    title: z.string(),
    minimumLength: z.number(),
  }),
}, async (body, { raw }) => {
  const targetRecord = await db.get(formConfigurationTable, { slug: raw.req.query.slug as string });

  return {
    type: 'success' as const,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    title: targetRecord.title || 'Unnamed form', // Title for the page
    minimumLength: targetRecord.minimumLength ?? 90, // Min required time for form validation
  };
});
