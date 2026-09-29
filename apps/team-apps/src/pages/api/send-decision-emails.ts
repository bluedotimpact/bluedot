import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { flagDecisionEmails } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    roundId: z.string(),
    // When present, only these applications are flagged (session scope);
    // otherwise every reviewed-but-unsent application in the round is.
    applicationIds: z.array(z.string()).max(1000).optional(),
  }),
  responseBody: z.object({
    flagged: z.number(),
  }),
}, async ({ roundId, applicationIds }) => flagDecisionEmails(roundId, applicationIds));
