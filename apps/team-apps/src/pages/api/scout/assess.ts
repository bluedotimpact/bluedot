import createHttpError from 'http-errors';
import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { fetchPerson } from '../../../features/scout/server';
import { assess } from '../../../features/scout/server/assess';
import { verifyAutomationToken } from '../../../features/scout/server/automationToken';

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    id: z.string().regex(/^rec[A-Za-z0-9]{14}$/),
    prompt: z.string().trim().min(20).max(20_000),
  }),
  responseBody: z.object({ decision: z.enum(['yes', 'no']), reasoning: z.string() }),
}, async (body, { raw }) => {
  verifyAutomationToken(raw.req.headers.authorization);
  const person = await fetchPerson(body.id);
  if (!person) throw new createHttpError.NotFound('Registration not found or not in a scouted course');
  return assess(person, body.prompt);
});
