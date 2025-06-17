import { z } from 'zod';
import jsonwebtoken from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { eq, groupDiscussionTable, zoomAccountTable } from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import env from '../../../lib/api/env';
import { parseZoomLink } from '../../../lib/zoomLinkParser';

export type MeetingJwtRequest = {
  groupDiscussionId: string,
  participantId?: string,
};

export type MeetingJwtResponse = {
  type: 'success',
  meetingSdkJwt: string,
  meetingNumber: string,
  meetingPassword: string,
} | {
  type: 'error',
  message: string,
};

const ZOOM_ROLE = {
  HOST: 1,
  PARTICIPANT: 0,
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    groupDiscussionId: z.string(),
    participantId: z.string().optional(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
    meetingSdkJwt: z.string(),
    meetingNumber: z.string(),
    meetingPassword: z.string(),
  }),
}, async (body) => {
  // Get the group discussion
  const groupDiscussions = await db.pg.select().from(groupDiscussionTable.pg).where(eq(groupDiscussionTable.pg.id, body.groupDiscussionId));
  const groupDiscussion = groupDiscussions[0];
  if (!groupDiscussion) {
    throw new createHttpError.NotFound(`Group discussion ${body.groupDiscussionId} not found`);
  }

  if (body.participantId) {
    const currentAttendees = groupDiscussion.attendees || [];
    if (!currentAttendees.includes(body.participantId)) {
      await db.airtableUpdate(groupDiscussionTable, {
        id: body.groupDiscussionId,
        attendees: [...currentAttendees, body.participantId],
      });
    }
  }

  if (!groupDiscussion.zoomAccount) {
    throw new createHttpError.InternalServerError(`Group discussion ${groupDiscussion.id} missing Zoom account`);
  }

  const zoomAccounts = await db.pg.select().from(zoomAccountTable.pg).where(eq(zoomAccountTable.pg.id, groupDiscussion.zoomAccount));
  const zoomAccount = zoomAccounts[0];
  if (!zoomAccount) {
    throw new createHttpError.InternalServerError(`Zoom account ${groupDiscussion.zoomAccount} not found`);
  }

  const { meetingNumber, meetingPassword } = parseZoomLink(zoomAccount.meetingLink || '');

  const issuedAt = Math.round(Date.now() / 1000);
  const expiresAt = issuedAt + 3600 * 4;
  const facilitators = groupDiscussion.facilitators || [];
  const oPayload = {
    sdkKey: env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
    mn: meetingNumber,
    role: body.participantId && facilitators.includes(body.participantId) ? ZOOM_ROLE.HOST : ZOOM_ROLE.PARTICIPANT,
    iat: issuedAt,
    exp: expiresAt,
    tokenExp: expiresAt,
  };

  const meetingSdkJwt = jsonwebtoken.sign(oPayload, env.ZOOM_CLIENT_SECRET, { algorithm: 'HS256' });

  return {
    type: 'success' as const,
    meetingSdkJwt,
    meetingNumber,
    meetingPassword,
  };
});

export const maxDuration = 60;
