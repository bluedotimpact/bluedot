import { timingSafeEqual } from 'node:crypto';
import createHttpError from 'http-errors';
import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import env from '../../../lib/api/env';
import { idsToLookUp, lookUpPeople } from '../../../features/scout/server/lookup';

// Called by Airtable automations, not by staff, so it checks the shared automation token
const verifyAutomationToken = (header: string | undefined) => {
  const token = header?.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  const expected = env.AIRTABLE_AUTOMATION_TOKEN;
  if (!expected) throw new createHttpError.InternalServerError('Automation token not configured');
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new createHttpError.Unauthorized('Invalid automation token');
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    ids: z.array(z.string().regex(/^rec[A-Za-z0-9]{14}$/)).max(200).optional(),
    everyoneMissing: z.boolean().optional(),
  }),
  responseBody: z.object({ accepted: z.number() }),
}, async (body, { raw }) => {
  verifyAutomationToken(raw.req.headers.authorization);
  const jobs = await idsToLookUp(body);
  // The lookups take a minute or more each, so answer now and work in the background
  void lookUpPeople(jobs);
  return { accepted: jobs.length };
});
