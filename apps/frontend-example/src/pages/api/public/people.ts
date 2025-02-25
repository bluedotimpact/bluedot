import { z } from 'zod';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { Person, personTable } from '../../../lib/api/db/tables';

export type GetPeopleResponse = {
  type: 'success',
  persons: Person[],
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    persons: z.array(z.any()),
  }),
}, async () => {
  const allPeople = await db.scan(personTable);
  const publicPeople = allPeople.filter((p) => p.isProfilePublic);

  return {
    type: 'success' as const,
    persons: publicPeople,
  };
});
