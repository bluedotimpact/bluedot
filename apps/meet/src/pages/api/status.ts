import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';

export type StatusResponse = {
  status: string;
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    status: z.string(),
  }),
}, async () => {
  return { status: 'Online' };
});
