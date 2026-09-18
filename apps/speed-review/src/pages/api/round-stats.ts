import createHttpError from 'http-errors';
import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { fetchRoundStats } from '../../lib/api/airtable';
import { requireAdmin } from '../../lib/api/requireAdmin';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    total: z.number(),
    evaluated: z.number(),
    accepted: z.number(),
  }),
}, async (_, { auth, raw: { req } }) => {
  await requireAdmin(auth.email);
  const round = typeof req.query.round === 'string' ? req.query.round : '';
  if (!round) throw new createHttpError.BadRequest('Missing required query param: round');
  return fetchRoundStats(round);
});
