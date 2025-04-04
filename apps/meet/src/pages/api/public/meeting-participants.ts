import type { NextApiRequest, NextApiResponse } from 'next';
import createHttpError from 'http-errors';
// eslint-disable-next-line import/no-extraneous-dependencies
import AirtableError from 'airtable/lib/airtable_error';
import { apiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { Group, groupDiscussionTable, groupTable, personTable, zoomAccountTable } from '../../../lib/api/db/tables';
import { parseZoomLink } from '../../../lib/zoomLinkParser';

export type MeetingParticipantsRequest = {
  groupId: string,
};

export type MeetingParticipantsResponse = {
  type: 'success',
  groupDiscussionId: string,
  participants: {
    id: string,
    name: string,
    role: 'host' | 'participant',
  }[],
  meetingNumber: string,
  meetingPassword: string,
  meetingHostKey: string,
  /* unix time in seconds */
  meetingStartTime: number,
  /* unix time in seconds */
  meetingEndTime: number,
} | {
  type: 'redirect',
  to: string,
} | {
  type: 'error',
  message: string,
};

export default apiRoute(async (
  req: NextApiRequest,
  res: NextApiResponse<MeetingParticipantsResponse>,
) => {
  let group: Group;
  try {
    group = await db.get(groupTable, req.body.groupId);
  } catch (err) {
    if (err instanceof AirtableError && err.statusCode === 404) {
      throw new createHttpError.NotFound(`Group ${req.body.groupId} not found`);
    }
    throw err;
  }
  const groupDiscussions = await Promise.all(
    group.groupDiscussions
      .map((groupDiscussionId) => db.get(groupDiscussionTable, groupDiscussionId)),
  );
  const groupDiscussionsWithDistance = groupDiscussions
    .filter((groupDiscussion) => !!groupDiscussion['Start date/time'] && !!groupDiscussion['End date/time'])
    .map((groupDiscussion) => ({
      groupDiscussion,
      distance: Math.abs((Date.now() / 1000) - groupDiscussion['Start date/time']!),
    }));
  if (groupDiscussionsWithDistance.length === 0) {
    res.status(404).json({
      type: 'error',
      message: 'No discussions found for this group.',
    });
    return;
  }

  let nearestGroupDiscussionWithDistance = groupDiscussionsWithDistance[0]!;
  groupDiscussionsWithDistance.forEach((groupDiscussionWithDistance) => {
    if (groupDiscussionWithDistance.distance < nearestGroupDiscussionWithDistance.distance) {
      nearestGroupDiscussionWithDistance = groupDiscussionWithDistance;
    }
  });
  const { groupDiscussion } = nearestGroupDiscussionWithDistance;

  if (!groupDiscussion['Zoom account']) {
    throw new createHttpError.InternalServerError(`Group discussion ${groupDiscussion.id} missing Zoom account`);
  }
  const zoomAccount = await db.get(zoomAccountTable, groupDiscussion['Zoom account']);
  const facilitators = await Promise.all(groupDiscussion.Facilitators.map((facilitatorId) => db.get(personTable, facilitatorId)));
  const participants = await Promise.all(
    groupDiscussion['Participants (Expected)']
      .map((participantId) => db.get(personTable, participantId)),
  );
  const { meetingNumber, meetingPassword } = parseZoomLink(zoomAccount['Meeting link']);
  const meetingHostKey = zoomAccount['Host key'];

  res.status(200).json({
    type: 'success',
    groupDiscussionId: groupDiscussion.id,
    participants: [
      ...facilitators.map((facilitator) => ({ id: facilitator.id, name: facilitator.name, role: 'host' as const })),
      ...participants.map((participant) => ({ id: participant.id, name: participant.name, role: 'participant' as const })),
    // eslint-disable-next-line no-nested-ternary
    ].sort((a, b) => ((a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)),
    meetingNumber,
    meetingPassword,
    meetingHostKey,
    meetingStartTime: groupDiscussion['Start date/time']!,
    meetingEndTime: groupDiscussion['End date/time']!,
  });
}, 'insecure_no_auth');

export const maxDuration = 60;
