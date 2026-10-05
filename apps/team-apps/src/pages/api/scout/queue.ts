import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { fetchInvitedThisWeek, fetchQueue } from '../../../features/scout/server';
import { COURSES } from '../../../features/scout/types';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    items: z.array(z.object({
      id: z.string(), course: z.enum(COURSES),
      name: z.string().optional(), email: z.string().optional(), roundId: z.string().optional(), roundName: z.string(), roundEnd: z.string().optional(), opinion: z.string().optional(),
      hasCertificate: z.boolean(), hasReport: z.boolean(),
    })),
    invitedThisWeek: z.record(z.object({ total: z.number(), viaApp: z.number() })),
  }),
}, async () => {
  const [items, invitedThisWeek] = await Promise.all([fetchQueue(), fetchInvitedThisWeek()]);
  return { items, invitedThisWeek };
});
