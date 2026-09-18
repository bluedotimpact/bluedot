import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    status: z.string(),
  }),
}, async () => {
  return { status: 'Online' };
});
