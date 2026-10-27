import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { fetchInvitedThisWeek, fetchLead, fetchQueue } from '../../../features/scout/server';
import { COURSES, PICK_REASONS, type Course } from '../../../features/scout/types';

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
    laterCourses: z.array(z.enum(COURSES)),
  }),
}, async (_, { auth, raw }) => {
  // ?viewAs= shows the picker as another lead sees it; everyone signed in can already see every course
  const viewAs = z.string().email().safeParse(raw.req.query.viewAs);
  const email = viewAs.success ? viewAs.data : auth.email;
  // ?courses= loads just those. Without it the lead's own courses come first, and laterCourses
  // names the rest for the page to load next.
  const asked = typeof raw.req.query.courses === 'string'
    ? raw.req.query.courses.split(',').filter((course): course is Course => (COURSES as readonly string[]).includes(course))
    : undefined;
  if (asked) {
    const [items, invitedThisWeek, lead] = await Promise.all([fetchQueue(asked), fetchInvitedThisWeek(), fetchLead(email)]);
    return {
      items, invitedThisWeek, leadCourses: lead.courses, leadName: lead.firstName, laterCourses: [],
    };
  }

  const lead = await fetchLead(email);
  const now = lead.courses.length > 0 ? lead.courses : COURSES;
  const [items, invitedThisWeek] = await Promise.all([fetchQueue(now), fetchInvitedThisWeek()]);
  return {
    items, invitedThisWeek, leadCourses: lead.courses, leadName: lead.firstName, laterCourses: COURSES.filter((course) => !now.includes(course)),
  };
});
