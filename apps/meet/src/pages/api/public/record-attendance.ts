import { z } from 'zod';
import createHttpError from 'http-errors';
import { groupDiscussionTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';

export type RecordAttendanceRequest = {
  groupDiscussionId: string;
  participantId: string;
  reason?: string;
};

export type RecordAttendanceResponse = {
  type: 'success';
} | {
  type: 'error';
  message: string;
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    groupDiscussionId: z.string(),
    participantId: z.string(),
    reason: z.string().optional(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
  }),
}, async (body) => {
  if (!body.groupDiscussionId) {
    throw new createHttpError.BadRequest('Missing group discussion id.');
  }

  if (!body.participantId) {
    throw new createHttpError.BadRequest('Missing participant id.');
  }

  const groupDiscussion = await db.get(groupDiscussionTable, { id: body.groupDiscussionId });

  const currentAttendees = groupDiscussion.attendees ?? [];
  if (!currentAttendees.includes(body.participantId)) {
    await db.update(groupDiscussionTable, {
      id: body.groupDiscussionId,
      attendees: [...currentAttendees, body.participantId],
    });
  }

  return {
    type: 'success' as const,
  };
});

export const maxDuration = 60;
