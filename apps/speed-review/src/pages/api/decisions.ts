import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { writeOpinions } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    opinions: z.array(z.object({
      id: z.string(),
      opinion: z.enum(['Weak no', 'Neutral', 'Weak yes', 'Strong yes']),
      decision: z.enum(['Accept', 'Reject']),
    })),
  }),
}, async ({ opinions }) => {
  await writeOpinions(opinions);
});
