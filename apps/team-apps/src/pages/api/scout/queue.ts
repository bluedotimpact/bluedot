import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { fetchInvitedThisWeek, fetchLead, fetchQueue } from '../../../features/scout/server';
import { COURSES, PICK_REASONS } from '../../../features/scout/types';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    items: z.array(z.object({
      id: z.string(), course: z.enum(COURSES),
      name: z.string().optional(), email: z.string().optional(), roundId: z.string().optional(), roundName: z.string(), roundEnd: z.string().optional(), opinion: z.string().optional(),
      hasCertificate: z.boolean(), hasReport: z.boolean(), mustLook: z.boolean(), pickReason: z.enum(PICK_REASONS).optional(),
    })),
    invitedThisWeek: z.record(z.object({ total: z.number(), viaApp: z.number() })),
    leadCourses: z.array(z.enum(COURSES)),
    leadName: z.string().optional(),
  }),
}, async (_, { auth }) => {
  const [items, invitedThisWeek, lead] = await Promise.all([fetchQueue(), fetchInvitedThisWeek(), fetchLead(auth.email)]);
  return {
    items, invitedThisWeek, leadCourses: lead.courses, leadName: lead.firstName,
  };
});
