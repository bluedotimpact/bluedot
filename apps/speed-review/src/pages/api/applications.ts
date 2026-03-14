import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { fetchApplications } from '../../lib/api/airtable';
import { requireAdmin } from '../../lib/api/requireAdmin';

const ApplicationSchema = z.object({
  id: z.string(),
  name: z.string(),
  profileUrl: z.string().optional(),
  otherProfileUrl: z.string().optional(),
  jobTitle: z.string().optional(),
  organisation: z.string().optional(),
  careerLevel: z.string().optional(),
  profession: z.string().optional(),
  fieldOfStudy: z.array(z.string()).optional(),
  pathToImpact: z.string().optional(),
  experience: z.string().optional(),
  skills: z.string().optional(),
  impressiveProject: z.string().optional(),
  reasoning: z.string().optional(),
  applicationSource: z.string().optional(),
  utmSource: z.string().optional(),
  aiSummary: z.string().optional(),
});

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    applications: z.array(ApplicationSchema),
    nextOffset: z.string().optional(),
  }),
}, async (_, { auth, raw: { req } }) => {
  await requireAdmin(auth.email);

  const round = typeof req.query.round === 'string' ? req.query.round : '';
  if (!round) throw new Error('Missing required query param: round');
  const offset = typeof req.query.offset === 'string' ? req.query.offset : undefined;
  try {
    return await fetchApplications(round, offset);
  } catch (err) {
    if (err instanceof Error && err.message.includes('LIST_RECORDS_ITERATOR_NOT_AVAILABLE')) {
      return { applications: [], nextOffset: undefined };
    }
    throw err;
  }
});
