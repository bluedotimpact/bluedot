import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { idsToLookUp, lookUpPeople } from '../../../features/scout/server/lookup';
import { verifyAutomationToken } from '../../../features/scout/server/automationToken';

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    ids: z.array(z.string().regex(/^rec[A-Za-z0-9]{14}$/)).max(200).optional(),
    everyoneMissing: z.boolean().optional(),
  }),
  responseBody: z.object({ accepted: z.number() }),
}, async (body, { raw }) => {
  verifyAutomationToken(raw.req.headers.authorization);
  const ids = await idsToLookUp(body);
  // The lookups take a minute or more each, so answer now and work in the background
  void lookUpPeople(ids);
  return { accepted: ids.length };
});
