import { z } from 'zod';
import { inviteForReal } from '../../lib/api/airtable';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { requireAdmin } from '../../lib/api/requireAdmin';

// The only route that writes to Airtable. Invite / Don't invite in the review
// flow are notes kept in the browser; this is the deliberate "for real" action.
export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({ id: z.string().regex(/^rec[A-Za-z0-9]{14}$/) }),
  responseBody: z.object({ ok: z.boolean(), reason: z.string().optional() }),
}, async (body, { auth }) => {
  await requireAdmin(auth.email);
  const result = await inviteForReal(body.id);
  return result.ok ? { ok: true } : { ok: false, reason: result.reason };
});
