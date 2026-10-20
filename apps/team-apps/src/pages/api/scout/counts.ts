import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { fetchInvitedThisWeek, fetchQueue } from '../../../features/scout/server';
import { verifyAutomationToken } from '../../../features/scout/server/automationToken';
import { COURSES } from '../../../features/scout/types';

// The numbers the round picker shows, for the Airtable automation that posts the backlog to Slack
export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    toReview: z.record(z.enum(COURSES), z.number()),
    mustLook: z.record(z.enum(COURSES), z.number()),
    invitedThisWeek: z.record(z.object({ total: z.number(), viaApp: z.number() })),
  }),
}, async (_, { raw }) => {
  verifyAutomationToken(raw.req.headers.authorization);
  const [items, invitedThisWeek] = await Promise.all([fetchQueue(), fetchInvitedThisWeek()]);
  const toReview = Object.fromEntries(COURSES.map((course) => [course, items.filter((item) => item.course === course).length]));
  const mustLook = Object.fromEntries(COURSES.map((course) => [course, items.filter((item) => item.course === course && item.mustLook).length]));
  return { toReview, mustLook, invitedThisWeek };
});
