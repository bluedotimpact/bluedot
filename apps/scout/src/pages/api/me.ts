import { z } from 'zod';
import { isAdmin } from '../../lib/api/airtable';
import { makeApiRoute } from '../../lib/api/makeApiRoute';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    email: z.string(),
    canAccess: z.boolean(),
  }),
}, async (_, { auth }) => {
  return { email: auth.email, canAccess: await isAdmin(auth.email) };
});
