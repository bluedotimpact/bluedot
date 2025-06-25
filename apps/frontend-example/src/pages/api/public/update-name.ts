import { z } from 'zod';
import createHttpError from 'http-errors';
import { personTable } from '@bluedot/db';
import db from '../../../lib/api/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    personId: z.string(),
    newFirstName: z.string(),
  }),
}, async (body) => {
  if (!body.newFirstName) {
    throw new createHttpError.BadRequest('First name cannot be blank.');
  }

  await db.update(personTable, { id: body.personId, firstName: body.newFirstName });
});
