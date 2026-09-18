import { z } from 'zod';
import { recordDecision, writesEnabled } from '../../lib/api/airtable';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { requireAdmin } from '../../lib/api/requireAdmin';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    id: z.string().regex(/^rec[A-Za-z0-9]{14}$/),
    decision: z.enum(['invite', 'not-now']),
  }),
  responseBody: z.object({ written: z.boolean() }),
}, async (body, { auth }) => {
  await requireAdmin(auth.email);
  if (!writesEnabled()) {
    // Trying the app out must not stamp statuses or send emails.
    return { written: false };
  }

  await recordDecision(body.id, body.decision);
  return { written: true };
});
