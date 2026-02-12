import { z } from 'zod';
import createHttpError from 'http-errors';
import { rooms } from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import { RoomSchema } from '../../../../lib/types';

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.array(RoomSchema),
}, async (body, { raw }) => {
  if (raw.req.method !== 'GET') {
    throw new createHttpError.MethodNotAllowed();
  }

  return rooms;
});
