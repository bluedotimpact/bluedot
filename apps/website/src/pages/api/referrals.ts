import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula } from 'airtable-ts-formula';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import db from '../../lib/api/db';
import {
  userTable,
} from '../../lib/api/db/tables';

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

  const user = (await db.scan(userTable, {
    filterByFormula: formula(await db.table(userTable), [
      '=',
      { field: 'email' },
      auth.email,
    ]),
  }))[0];

  if (!user) {
    throw new createHttpError.NotFound(`User not found for email: ${auth.email}`);
  }

  return {
    type: 'success' as const,
    referralId: user.referralId,
  };
});
