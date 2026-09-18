import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { moveApplicationToAgisc } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    applicationId: z.string(),
    roundId: z.string(),
  }),
}, async ({ applicationId, roundId }) => {
  await moveApplicationToAgisc(applicationId, roundId);
});
