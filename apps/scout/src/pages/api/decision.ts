import { z } from 'zod';
import { declineForReal, inviteForReal } from '../../lib/api/airtable';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { requireAdmin } from '../../lib/api/requireAdmin';

// The only route that writes to Airtable. Both decisions are confirmed in the UI
// first; the admin check here skips the cache so a revoked admin cannot write.
export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    id: z.string().regex(/^rec[A-Za-z0-9]{14}$/),
    decision: z.enum(['invite', 'decline']),
  }),
  responseBody: z.object({ ok: z.boolean(), reason: z.string().optional() }),
}, async (body, { auth }) => {
  await requireAdmin(auth.email, { fresh: true });
  const result = body.decision === 'invite' ? await inviteForReal(body.id) : await declineForReal(body.id);
  return result.ok ? { ok: true } : { ok: false, reason: result.reason };
});
