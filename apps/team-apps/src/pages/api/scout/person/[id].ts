import { z } from 'zod';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { fetchPerson } from '../../../../features/scout/server';

export default makeApiRoute({ requireAuth: true, responseBody: z.object({ person: z.any() }) }, async (_, { raw }) => {
  const parsed = z.string().regex(/^rec[A-Za-z0-9]{14}$/).safeParse(raw.req.query.id);
  if (!parsed.success) throw new createHttpError.BadRequest('Invalid participant id');
  const person = await fetchPerson(parsed.data);
  if (!person) throw new createHttpError.NotFound('Participant not found');
  return { person };
});
