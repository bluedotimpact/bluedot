import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { fetchInvitedThisWeek, fetchQueue } from '../../../features/scout/server';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    items: z.array(z.object({
      id: z.string(), course: z.enum(['Biosecurity', 'Technical AI Safety', 'Technical AI Safety Project']),
      name: z.string().optional(), roundId: z.string().optional(), roundName: z.string(), roundEnd: z.string().optional(), opinion: z.string().optional(),
      hasCertificate: z.boolean(), hasReport: z.boolean(),
    })),
    invitedThisWeek: z.record(z.object({ total: z.number(), viaApp: z.number() })),
  }),
}, async () => {
  const [items, invitedThisWeek] = await Promise.all([fetchQueue(), fetchInvitedThisWeek()]);
  return { items, invitedThisWeek };
});
