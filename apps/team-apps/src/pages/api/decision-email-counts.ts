import createHttpError from 'http-errors';
import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { fetchDecisionEmailCounts } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    reviewed: z.number(),
    alreadySent: z.number(),
    confirmedSent: z.number(),
    pending: z.number(),
    pendingAccepted: z.number(),
    pendingRejected: z.number(),
  }),
}, async (_, { raw: { req } }) => {
  const round = typeof req.query.round === 'string' ? req.query.round : '';
  if (!round) throw new createHttpError.BadRequest('Missing required query param: round');
  // The round id is interpolated into an Airtable filterByFormula, so only
  // record-id-shaped values are allowed through.
  if (!/^rec[A-Za-z0-9]+$/.test(round)) throw new createHttpError.BadRequest('Invalid round id');
  return fetchDecisionEmailCounts(round);
});
