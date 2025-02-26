import { z } from 'zod';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { personTable } from '../../../lib/api/db/tables';

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
  const allPeople = await db.scan(personTable);
  const publicPeople = allPeople.filter((p) => p.isProfilePublic);

  return publicPeople;
});
