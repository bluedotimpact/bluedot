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
    // await db.airtableUpdate(unitFeedbackTable, {
    //   id: 'rec01bcyFGQhAXirf',
    //   userEmail: 'w.howard256@gmail.com',
    //   unitId: 'recxfbBfcGWxgI4pD',
    //   overallRating: 5,
    // });

    const results = await db.pg.select().from(unitFeedbackTable.pg).limit(100);
    console.log({ results });
  } catch (e) {
    console.error('An error occurred:', e);
  }

  return [];
});
