import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { writeOpinions } from '../../lib/api/airtable';
import { requireAdmin } from '../../lib/api/requireAdmin';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    opinions: z.array(z.object({
      id: z.string(),
      opinion: z.enum(['Weak no', 'Neutral', 'Weak yes', 'Strong yes']),
      decision: z.enum(['Accept', 'Reject']),
    })).max(50),
  }),
}, async ({ opinions }, { auth }) => {
  await requireAdmin(auth.email);
  await writeOpinions(opinions);
});
