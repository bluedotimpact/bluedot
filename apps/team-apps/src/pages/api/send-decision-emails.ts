import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { flagDecisionEmails } from '../../lib/api/airtable';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    // Interpolated into an Airtable filterByFormula, so only record-id-shaped
    // values are allowed through.
    roundId: z.string().regex(/^rec[A-Za-z0-9]+$/),
    // When present, only these applications are flagged (session scope);
    // otherwise every reviewed-but-unsent application in the round is.
    applicationIds: z.array(z.string()).max(1000).optional(),
  }),
  responseBody: z.object({
    flagged: z.number(),
  }),
}, async ({ roundId, applicationIds }) => flagDecisionEmails(roundId, applicationIds));
