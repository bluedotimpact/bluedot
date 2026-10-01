import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { fetchFilterOptions } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    options: z.array(z.object({ id: z.string(), label: z.string() })),
  }),
}, async () => {
  const options = await fetchFilterOptions();
  return { options };
});
