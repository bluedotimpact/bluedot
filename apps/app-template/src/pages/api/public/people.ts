import { z } from 'zod';
import { personTable } from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

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
  const allPeople = await db.scan(personTable, { isProfilePublic: true });

  return allPeople.map((person) => ({
    id: person.id,
    email: person.email,
    firstName: person.firstName,
    lastName: person.lastName,
    ethnicGroup: person.ethnicGroup,
    careerPlans: person.careerPlans,
    biography: person.biography,
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    appliedToOpportunities: person.appliedToOpportunities || [],
    isProfilePublic: person.isProfilePublic || false,
  }));
});
