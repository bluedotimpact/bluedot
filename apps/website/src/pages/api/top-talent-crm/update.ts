import { z } from 'zod';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { assertBluedotStaff, getNotionToken, updatePerson } from '../../../lib/api/topTalentCrm';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    pageId: z.string().min(1),
    status: z.string().optional(),
    scores: z.record(z.string(), z.number().int().min(1).max(5)).optional(),
    notes: z.string().optional(),
    localDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  }),
  responseBody: z.object({ id: z.string() }),
}, async (body, { auth }) => {
  assertBluedotStaff(auth.email);
  return updatePerson(getNotionToken(), body.pageId, {
    status: body.status,
    scores: body.scores,
    notes: body.notes,
    localDate: body.localDate,
  });
});
