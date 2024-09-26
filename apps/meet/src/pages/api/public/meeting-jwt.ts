import type { NextApiRequest, NextApiResponse } from 'next';
import jsonwebtoken from 'jsonwebtoken';
import createHttpError from 'http-errors';
import { apiRoute } from '../../../lib/api/apiRoute';
import db, { cohortClassTable, zoomAccountTable } from '../../../lib/api/db';
import env from '../../../lib/api/env';
import { parseZoomLink } from '../../../lib/zoomLinkParser';

export type MeetingJwtRequest = {
  cohortClassId: string,
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

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse<MeetingJwtResponse>,
) => {
  const cohortClass = await db.get(cohortClassTable, req.body.cohortClassId);
  if (req.body.participantId && !cohortClass.Attendees.includes(req.body.participantId)) {
    await db.update(cohortClassTable, { ...cohortClass, Attendees: [...cohortClass.Attendees, req.body.participantId] });
  }
  if (!cohortClass['Zoom account']) {
    throw new createHttpError.InternalServerError(`Cohort class ${cohortClass.id} missing Zoom account`);
  }
  const zoomAccount = await db.get(zoomAccountTable, cohortClass['Zoom account']);
  const { meetingNumber, meetingPassword } = parseZoomLink(zoomAccount['Meeting link']);

  const issuedAt = Math.round(Date.now() / 1000);
  const expiresAt = issuedAt + 3600 * 4;
  const oPayload = {
    sdkKey: env.NEXT_PUBLIC_ZOOM_CLIENT_ID,
    mn: meetingNumber,
    role: cohortClass.Facilitators.includes(req.body.participantId) ? ZOOM_ROLE.HOST : ZOOM_ROLE.PARTICIPANT,
    iat: issuedAt,
    exp: expiresAt,
    tokenExp: expiresAt,
  };

  const meetingSdkJwt = jsonwebtoken.sign(oPayload, env.ZOOM_CLIENT_SECRET, { algorithm: 'HS256' });

  res.status(200).json({
    type: 'success',
    meetingSdkJwt,
    meetingNumber,
    meetingPassword,
  });
}, 'insecure_no_auth');

export const maxDuration = 60;
