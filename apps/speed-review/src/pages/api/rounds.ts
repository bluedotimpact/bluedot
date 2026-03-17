import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { fetchRounds } from '../../lib/api/airtable';
import { requireAdmin } from '../../lib/api/requireAdmin';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    rounds: z.array(z.object({ id: z.string(), name: z.string(), course: z.string() })),
  }),
}, async (_, { auth }) => {
  await requireAdmin(auth.email);
  const rounds = await fetchRounds();
  return { rounds };
});
