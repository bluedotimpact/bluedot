import { z } from 'zod';
import createHttpError from 'http-errors';
import { userTable } from '@bluedot/db';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import db from '../../lib/api/db';

export type GetReferralResponse = {
  type: 'success';
  referralId: string;
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    referralId: z.string(),
  }),
}, async (body, { auth, raw }) => {
  if (raw.req.method !== 'GET') {
    throw new createHttpError.MethodNotAllowed();
  }

  const user = await db.get(userTable, { email: auth.email });

  return {
    type: 'success' as const,
    referralId: user.referralId,
  };
});
