import type { NextApiRequest, NextApiResponse } from 'next';
import { apiRoute } from '../../../lib/api/apiRoute';
import db from '../../../lib/api/db';
import { groupDiscussionTable } from '../../../lib/api/db/tables';

export type RecordAttendanceRequest = {
  groupDiscussionId: string,
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
  if (!req.body.groupDiscussionId) {
    res.status(400).json({ type: 'error', message: 'Missing group discussion id.' });
    return;
  }
  if (!req.body.participantId) {
    res.status(400).json({ type: 'error', message: 'Missing participant id.' });
    return;
  }

  const groupDiscussion = await db.get(groupDiscussionTable, req.body.groupDiscussionId);
  if (!groupDiscussion.Attendees.includes(req.body.participantId)) {
    await db.update(groupDiscussionTable, { ...groupDiscussion, Attendees: [...groupDiscussion.Attendees, req.body.participantId] });
  }

  res.status(200).json({
    type: 'success',
  });
}, 'insecure_no_auth');

export const maxDuration = 60;
