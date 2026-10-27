import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import {
  fetchInvitedThisWeek, fetchLead, fetchQueue, startSupportedCheck, warmRounds,
} from '../../../features/scout/server';
import { COURSES, PICK_REASONS, type Course } from '../../../features/scout/types';

const PARTS = ['shortlist', 'backlog', 'all'] as const;

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    items: z.array(z.object({
      id: z.string(), course: z.enum(COURSES),
      name: z.string().optional(), email: z.string().optional(), roundId: z.string().optional(), roundName: z.string(), roundEnd: z.string().optional(), opinion: z.string().optional(),
      hasCertificate: z.boolean(), hasReport: z.boolean(), mustLook: z.boolean(), pickReason: z.enum(PICK_REASONS).optional(),
    })),
    invitedThisWeek: z.record(z.object({ total: z.number(), viaApp: z.number() })).optional(),
    leadCourses: z.array(z.enum(COURSES)).optional(),
    leadName: z.string().optional(),
    // What the page still has to load after the first screen
    later: z.array(z.object({ courses: z.array(z.enum(COURSES)), part: z.enum(PARTS) })),
  }),
}, async (_, { auth, raw }) => {
  // ?viewAs= shows the picker as another lead sees it; everyone signed in can already see every course
  const viewAs = z.string().email().safeParse(raw.req.query.viewAs);
  const email = viewAs.success ? viewAs.data : auth.email;
  // ?courses=&part= is one of those follow-up reads: only the people
  const asked = typeof raw.req.query.courses === 'string'
    ? raw.req.query.courses.split(',').filter((course): course is Course => (COURSES as readonly string[]).includes(course))
    : undefined;
  if (asked) {
    const part = z.enum(PARTS).catch('all').parse(raw.req.query.part);
    return { items: await fetchQueue(asked, part), later: [] };
  }

  // These don't depend on who is signed in, so they run while the lead is looked up
  warmRounds();
  const supported = startSupportedCheck();
  const invited = fetchInvitedThisWeek();
  invited.catch(() => undefined);
  const lead = await fetchLead(email);
  if (lead.courses.length === 0) {
    const [items, invitedThisWeek] = await Promise.all([fetchQueue(COURSES, 'all', supported), invited]);
    return {
      items, invitedThisWeek, leadCourses: [], leadName: lead.firstName, later: [],
    };
  }

  // A lead sees their shortlist first; their backlog and the other courses follow
  const others = COURSES.filter((course) => !lead.courses.includes(course));
  const [items, invitedThisWeek] = await Promise.all([fetchQueue(lead.courses, 'shortlist', supported), invited]);
  return {
    items,
    invitedThisWeek,
    leadCourses: lead.courses,
    leadName: lead.firstName,
    later: [{ courses: lead.courses, part: 'backlog' as const }, ...(others.length > 0 ? [{ courses: others, part: 'all' as const }] : [])],
  };
});
