import { z } from 'zod';
import { unitFeedbackTable } from '@bluedot/db';

import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { db } from '../../../lib/api/db';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.any(),
}, async () => {
  try {
    // Do some stuff with users as a test
    // await db.airtableInsert(unitFeedbackTable, {
    //   unitId: 'abcd',
    //   overallRating: 4.5,
    // });

    const results = await db.pg.select().from(unitFeedbackTable.pg);
    console.log({ results });
  } catch (e) {
    console.error('An error occurred:', e);
  }

  return [];
});
