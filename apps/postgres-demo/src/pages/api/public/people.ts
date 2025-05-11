import { z } from 'zod';
import { userTable } from '@bluedot/db';

import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import { db } from '../../../lib/api/db';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.any(),
}, async () => {
  // Do some stuff with users as a test
  await db.airtableInsert(userTable, {
    id: Math.random().toString(36).substring(2, 15),
    email: 'johndoe@example.com',
  });

  console.log({ db });

  const allUsers = await db.select().from(userTable);

  console.log(allUsers);

  return [];
});
