import type { NextApiRequest, NextApiResponse } from 'next';
import { apiRoute } from '../../../lib/api/apiRoute';
import db, { cohortClassTable } from '../../../lib/api/db';

export type RecordAttendanceRequest = {
  cohortClassId: string,
  participantId: string,
  reason?: string,
};

export type RecordAttendanceResponse = {
  type: 'success',
} | {
  type: 'error',
  message: string,
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse<RecordAttendanceResponse>,
) => {
  if (!req.body.cohortClassId) {
    res.status(400).json({ type: 'error', message: 'Missing cohort class id.' });
    return;
  }
  if (!req.body.participantId) {
    res.status(400).json({ type: 'error', message: 'Missing participant id.' });
    return;
  }

  const cohortClass = await db.get(cohortClassTable, req.body.cohortClassId);
  if (!cohortClass.Attendees.includes(req.body.participantId)) {
    await db.update(cohortClassTable, { ...cohortClass, Attendees: [...cohortClass.Attendees, req.body.participantId] });
  }

  res.status(200).json({
    type: 'success',
  });
}, 'insecure_no_auth');

export const maxDuration = 60;
