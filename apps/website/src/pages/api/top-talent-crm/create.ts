import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import {
  assertBluedotStaff, getNotionToken, resolveOwnerByEmail, createPerson,
} from '../../../lib/api/topTalentCrm';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    name: z.string().min(1),
    linkedInUrl: z.string().url(),
    status: z.string().optional(),
    // Score column name -> 1..5. Unknown keys are ignored downstream.
    scores: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
    notes: z.string().optional(),
    // Date the client computed in the user's local timezone (YYYY-MM-DD).
    localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  responseBody: z.object({ id: z.string(), url: z.string() }),
}, async (body, { auth }) => {
  assertBluedotStaff(auth.email);
  const token = getNotionToken();
  // Owner is the signed-in staff member, resolved from their email — no client input.
  const ownerUserId = await resolveOwnerByEmail(token, auth.email);
  return createPerson(token, {
    name: body.name,
    linkedInUrl: body.linkedInUrl,
    status: body.status,
    scores: body.scores,
    notes: body.notes,
    localDate: body.localDate,
    ownerUserId,
  });
});
