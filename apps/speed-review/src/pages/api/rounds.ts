import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { fetchRounds } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    rounds: z.array(z.object({ id: z.string(), name: z.string(), course: z.string() })),
  }),
}, async () => {
  const rounds = await fetchRounds();
  return { rounds };
});
