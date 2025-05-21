import { z } from 'zod';
import { userTable } from '@bluedot/db';

import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { db } from '../../../lib/api/db';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.any(),
}, async () => {
  try {
    // Do some stuff with users as a test
    await db.airtableInsert(userTable, {
      email: 'johndoe@example.com',
      name: 'John Doe',
    });

    const allUsers = await db.select().from(userTable);
    console.log({ allUsers });
  } catch (e) {
    console.error('An error occurred:', e);
  }

  return [];
});
