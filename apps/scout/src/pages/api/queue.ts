import { z } from 'zod';
import { fetchQueue } from '../../lib/api/airtable';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { requireAdmin } from '../../lib/api/requireAdmin';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    items: z.array(z.object({
      id: z.string(),
      course: z.enum(['Biosecurity', 'Technical AI Safety', 'Technical AI Safety Project']),
      roundName: z.string(),
      roundEnd: z.string().optional(),
      opinion: z.string().optional(),
      hasCertificate: z.boolean(),
      hasReport: z.boolean(),
    })),
  }),
}, async (_, { auth }) => {
  await requireAdmin(auth.email);
  return { items: await fetchQueue() };
});
