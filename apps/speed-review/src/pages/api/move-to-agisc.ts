import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { moveApplicationToAgisc } from '../../lib/api/airtable';
import { requireAdmin } from '../../lib/api/requireAdmin';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    applicationId: z.string(),
    roundId: z.string(),
  }),
}, async ({ applicationId, roundId }, { auth }) => {
  await requireAdmin(auth.email);
  await moveApplicationToAgisc(applicationId, roundId);
});
