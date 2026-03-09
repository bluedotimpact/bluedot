import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { fetchRoundStats } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    total: z.number(),
    evaluated: z.number(),
    accepted: z.number(),
  }),
}, async (_, { raw: { req } }) => {
  const round = typeof req.query.round === 'string' ? req.query.round : '';
  if (!round) throw new Error('Missing required query param: round');
  return fetchRoundStats(round);
});
