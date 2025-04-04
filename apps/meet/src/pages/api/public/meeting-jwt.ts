import { z } from 'zod';
import jsonwebtoken from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { groupDiscussionTable, zoomAccountTable } from '../../../lib/api/db/tables';
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
}, async (body, { raw }) => {
  const groupDiscussion = await db.get(groupDiscussionTable, body.groupDiscussionId);
  if (body.participantId && !groupDiscussion.Attendees.includes(body.participantId)) {
    await db.update(groupDiscussionTable, { ...groupDiscussion, Attendees: [...groupDiscussion.Attendees, body.participantId] });
  }
  if (!groupDiscussion['Zoom account']) {
    throw new createHttpError.InternalServerError(`Group discussion ${groupDiscussion.id} missing Zoom account`);
  }
  const zoomAccount = await db.get(zoomAccountTable, groupDiscussion['Zoom account']);
  const { meetingNumber, meetingPassword } = parseZoomLink(zoomAccount['Meeting link']);

  const issuedAt = Math.round(Date.now() / 1000);
  const expiresAt = issuedAt + 3600 * 4;
  const oPayload = {
    sdkKey: env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
    mn: meetingNumber,
    role: body.participantId && groupDiscussion.Facilitators.includes(body.participantId) ? ZOOM_ROLE.HOST : ZOOM_ROLE.PARTICIPANT,
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
