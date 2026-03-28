import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { resetOpinion } from '../../lib/api/airtable';
import { requireAdmin } from '../../lib/api/requireAdmin';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    applicationId: z.string(),
  }),
}, async ({ applicationId }, { auth }) => {
  await requireAdmin(auth.email);
  await resetOpinion(applicationId);
});
