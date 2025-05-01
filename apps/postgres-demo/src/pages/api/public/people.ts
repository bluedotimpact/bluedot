import { z } from 'zod';

import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { userTable } from '../../../db/schema';
import { pg } from '../../../db';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.array(z.object({
    id: z.string(),
    email: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    ethnicGroup: z.string(),
    careerPlans: z.string(),
    biography: z.string(),
    appliedToOpportunities: z.array(z.string()),
    isProfilePublic: z.boolean(),
  })),
}, async () => {
  // Insert a new user
  await pg.insert(userTable).values({
    id: Math.random().toString(36).substring(2, 15),
    email: 'johndoe@example.com',
  });

  // Query all users
  const allUsers = await pg.select().from(userTable);

  // Log the result
  console.log(allUsers);

  return [];

  // const allPeople = await db.scan(personTable);
  // const publicPeople = allPeople.filter((p) => p.isProfilePublic);

  // return publicPeople;
});
