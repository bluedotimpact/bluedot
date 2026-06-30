import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { assertBluedotStaff, getNotionToken, findByLinkedIn } from '../../../lib/api/topTalentCrm';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({ linkedInUrl: z.string().url() }),
  responseBody: z.object({
    match: z.object({
      id: z.string(),
      url: z.string(),
      name: z.string(),
      status: z.string().nullable(),
      scores: z.record(z.string(), z.number()),
    }).nullable(),
  }),
}, async (body, { auth }) => {
  assertBluedotStaff(auth.email);
  const match = await findByLinkedIn(getNotionToken(), body.linkedInUrl);
  return { match };
});
