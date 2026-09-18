import { z } from 'zod';
import createHttpError from 'http-errors';
import { fetchPerson } from '../../../lib/api/airtable';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { requireAdmin } from '../../../lib/api/requireAdmin';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({ person: z.any() }),
}, async (_, { auth, raw }) => {
  await requireAdmin(auth.email);
  const { id } = raw.req.query;
  if (typeof id !== 'string' || !/^rec[A-Za-z0-9]{14}$/.test(id)) {
    throw new createHttpError.BadRequest('Invalid record id');
  }

  const person = await fetchPerson(id);
  if (!person) throw new createHttpError.NotFound('Person not found');
  return { person };
});
