import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { moveApplicationToCourse } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    applicationId: z.string(),
    roundId: z.string(),
    targetCourse: z.enum(['AGI Strategy', 'Technical AI Safety']),
  }),
}, async ({ applicationId, roundId, targetCourse }) => {
  await moveApplicationToCourse(applicationId, roundId, targetCourse);
});
