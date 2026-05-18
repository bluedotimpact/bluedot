import createHttpError from 'http-errors';
import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { fetchApplications } from '../../lib/api/airtable';
import { requireAdmin } from '../../lib/api/requireAdmin';
import { type SortDirection } from '../../lib/client/types';

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
  allowMoveToAgisc: z.boolean().optional(),
  previousCourses: z.array(z.string()).optional(),
  commitmentScore: z.number().optional(),
  commitmentRationale: z.string().optional(),
  impressivenessScore: z.number().optional(),
  impressivenessRationale: z.string().optional(),
  technicalSkillScore: z.number().optional(),
  technicalSkillRationale: z.string().optional(),
  totalScore: z.number().optional(),
});

const parseSortDirection = (raw: unknown): SortDirection => (raw === 'asc' ? 'asc' : 'desc');

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    applications: z.array(ApplicationSchema),
    nextOffset: z.string().optional(),
  }),
}, async (_, { auth, raw: { req } }) => {
  await requireAdmin(auth.email);

  const round = typeof req.query.round === 'string' ? req.query.round : '';
  if (!round) throw new createHttpError.BadRequest('Missing required query param: round');
  const offset = typeof req.query.offset === 'string' ? req.query.offset : undefined;
  const sortDirection = parseSortDirection(req.query.sortDirection);
  try {
    return await fetchApplications(round, offset, sortDirection);
  } catch (err) {
    if (err instanceof Error && err.message.includes('LIST_RECORDS_ITERATOR_NOT_AVAILABLE')) {
      // Offset expired — restart pagination from the beginning.
      // The filter excludes already-decided applications, so this
      // will return the next batch of unreviewed ones.
      return fetchApplications(round, undefined, sortDirection);
    }

    throw err;
  }
});
