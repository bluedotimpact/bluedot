import createHttpError from 'http-errors';
import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { fetchApplicationHistory } from '../../lib/api/airtable';
import { requireAdmin } from '../../lib/api/requireAdmin';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    history: z.array(z.object({
      id: z.string(),
      roundName: z.string(),
      humanOpinion: z.string(),
      decision: z.string(),
      createdAt: z.string(),
    })),
  }),
}, async (_, { auth, raw: { req } }) => {
  await requireAdmin(auth.email);
  const id = typeof req.query.id === 'string' ? req.query.id : '';
  if (!/^rec[A-Za-z0-9]{14}$/.test(id)) throw new createHttpError.BadRequest('Missing or invalid query param: id');
  const history = await fetchApplicationHistory(id);
  return { history };
});
