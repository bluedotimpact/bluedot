import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { recordDecision } from '../../../features/scout/server';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({ id: z.string().regex(/^rec[A-Za-z0-9]{14}$/), decision: z.enum(['invite', 'decline']) }),
  responseBody: z.object({ ok: z.boolean(), reason: z.string().optional() }),
}, async ({ id, decision }) => {
  try {
    return await recordDecision(id, decision);
  } catch {
    // A timed-out write might have reached Airtable. A retry re-reads the record
    // first, so it refuses rather than writing twice.
    throw createHttpError(503, 'Could not confirm the save. Retry to check its status, or refresh the queue before continuing.', { expose: true });
  }
});
