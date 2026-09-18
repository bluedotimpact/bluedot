import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { resetOpinion } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    applicationId: z.string(),
  }),
}, async ({ applicationId }) => {
  await resetOpinion(applicationId);
});
