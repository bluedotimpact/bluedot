import { z } from 'zod';
import createHttpError from 'http-errors';
import { rooms } from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import { RoomSchema } from '../../../../../lib/types';
import env from '../../../../../lib/api/env';

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.optional(z.object({
    currentUrl: z.string(),
    lastUpdatedAt: z.number(),
  })),
  responseBody: RoomSchema.optional(),
}, async (body, { raw }) => {
  if (raw.req.method === 'OPTIONS') {
    return undefined;
  }

  const token = raw.req.headers.authorization?.slice('Bearer '.length).trim();
  if (token !== env.DISPLAY_BEARER_TOKEN) {
    throw new createHttpError.Unauthorized('Bad token');
  }

  const room = rooms.find((r) => r.id === raw.req.query.roomId);
  if (!room) {
    throw new createHttpError.NotFound(`Room with id ${raw.req.query.roomId} not found`);
  }

  switch (raw.req.method) {
    // The room device is getting the room details
    case 'GET': {
      room.status.lastHeartbeatAt = Date.now() / 1000;
      return room;
    }

    // The room has an update for us
    case 'PUT': {
      if (!body) {
        throw new createHttpError.BadRequest('Expected PUT request to include status payload');
      }
      if (body.lastUpdatedAt < room.status.lastUpdatedAt) {
        throw new createHttpError.Conflict('Expected lastUpdatedAt to be newer than lastUpdatedAt');
      }
      room.status.currentUrl = body.currentUrl;
      room.status.lastUpdatedAt = body.lastUpdatedAt;
      room.status.lastHeartbeatAt = Date.now() / 1000;
      return room;
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
