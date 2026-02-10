import { z } from 'zod';
import createHttpError from 'http-errors';
import { rooms } from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import { RoomSchema } from '../../../../../lib/types';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.optional(z.object({ currentUrl: z.string(), lastUpdatedAt: z.number() })),
  responseBody: RoomSchema,
}, async (body, { raw }) => {
  const roomId = raw.req.query.roomId as string;
  const room = rooms.find((r) => r.id === roomId);
  if (!room) {
    throw new createHttpError.NotFound(`Room with id ${roomId} not found`);
  }

  switch (raw.req.method) {
    // The user's device is getting the room details
    case 'GET': {
      return room;
    }

    // The user wants to control the room
    case 'PUT': {
      if (!body) {
        throw new createHttpError.BadRequest('Expected PUT request to include status payload');
      }

      if (body.lastUpdatedAt < room.status.lastUpdatedAt) {
        throw new createHttpError.Conflict('Expected lastUpdatedAt to be newer than lastUpdatedAt');
      }

      room.status.currentUrl = body.currentUrl;
      room.status.lastUpdatedAt = body.lastUpdatedAt;
      return room;
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
