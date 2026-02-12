import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  groupTable, groupDiscussionTable, meetPersonTable, zoomAccountTable,
} from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import { parseZoomLink } from '../../../lib/zoomLinkParser';

export type MeetingParticipantsRequest = {
  groupId: string;
};

export type MeetingParticipantsResponse = {
  type: 'success';
  groupDiscussionId: string;
  participants: {
    id: string;
    name: string;
    role: 'host' | 'participant';
  }[];
  meetingNumber: string;
  meetingPassword: string;
  meetingHostKey: string;
  /* unix time in seconds */
  meetingStartTime: number;
  /* unix time in seconds */
  meetingEndTime: number;
  activityDoc?: string;
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    groupId: z.string(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
    groupDiscussionId: z.string(),
    participants: z.array(z.object({
      id: z.string(),
      name: z.string(),
      role: z.enum(['host', 'participant']),
    })),
    meetingNumber: z.string(),
    meetingPassword: z.string(),
    meetingHostKey: z.string(),
    meetingStartTime: z.number(),
    meetingEndTime: z.number(),
    activityDoc: z.string().optional(),
  }),
}, async (body) => {
  // Get the group
  await db.get(groupTable, { id: body.groupId });

  // Get group discussions for this group
  const groupDiscussions = await db.scan(groupDiscussionTable, { group: body.groupId });

  const groupDiscussionsWithDistance = groupDiscussions
    .filter((groupDiscussion) => !!groupDiscussion.startDateTime && !!groupDiscussion.endDateTime)
    .map((groupDiscussion) => ({
      groupDiscussion,
      distance: Math.abs((Date.now() / 1000) - (groupDiscussion.startDateTime)),
    }));

  if (groupDiscussionsWithDistance.length === 0) {
    throw new createHttpError.NotFound('No discussions found for this group.');
  }

  let nearestGroupDiscussionWithDistance = groupDiscussionsWithDistance[0]!;
  groupDiscussionsWithDistance.forEach((groupDiscussionWithDistance) => {
    if (groupDiscussionWithDistance.distance < nearestGroupDiscussionWithDistance.distance) {
      nearestGroupDiscussionWithDistance = groupDiscussionWithDistance;
    }
  });
  const { groupDiscussion } = nearestGroupDiscussionWithDistance;

  if (!groupDiscussion.zoomAccount) {
    throw new createHttpError.InternalServerError(`Group discussion ${groupDiscussion.id} missing Zoom account`);
  }

  // Get zoom account
  const zoomAccount = await db.get(zoomAccountTable, { id: groupDiscussion.zoomAccount });

  // Get facilitators and participants
  const facilitatorIds = groupDiscussion.facilitators || [];
  const participantIds = groupDiscussion.participantsExpected || [];

  // Get all people and filter by IDs
  const allPeople = await db.scan(meetPersonTable);
  const facilitators = allPeople.filter((person) => facilitatorIds.includes(person.id));
  const participants = allPeople.filter((person) => participantIds.includes(person.id));

  const { meetingNumber, meetingPassword } = parseZoomLink(zoomAccount.meetingLink);
  const meetingHostKey = zoomAccount.hostKey;

  return {
    type: 'success' as const,
    groupDiscussionId: groupDiscussion.id,
    participants: [
      ...facilitators.map((facilitator) => ({ id: facilitator.id, name: facilitator.name, role: 'host' as const })),
      ...participants.map((participant) => ({ id: participant.id, name: participant.name, role: 'participant' as const })),
    // eslint-disable-next-line no-nested-ternary
    ].sort((a, b) => ((a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)),
    meetingNumber,
    meetingPassword,
    meetingHostKey,
    meetingStartTime: groupDiscussion.startDateTime,
    meetingEndTime: groupDiscussion.endDateTime,
    activityDoc: groupDiscussion.activityDoc ?? undefined,
  };
});

export const maxDuration = 60;
