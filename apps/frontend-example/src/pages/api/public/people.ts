import { z } from 'zod';
import { eq, personTable, InferSelectModel } from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

type Person = InferSelectModel<typeof personTable.pg>;

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
  const publicPeople = await db.pg.select().from(personTable.pg).where(eq(personTable.pg.isProfilePublic, true));

  return {
    type: 'success' as const,
    persons: publicPeople,
  };
});
