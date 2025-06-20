import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, inArray, groupTable, groupDiscussionTable, meetPersonTable, zoomAccountTable,
} from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
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
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.object({
    groupId: z.string(),
  }),
  responseBody: z.union([
    z.object({
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
    }),
    z.object({
      type: z.literal('redirect'),
      to: z.string(),
    }),
  ]),
}, async (body) => {
  // Get the group
  const groups = await db.pg.select().from(groupTable.pg).where(eq(groupTable.pg.id, body.groupId));
  const group = groups[0];

  if (!group) {
    throw new createHttpError.NotFound(`Group ${body.groupId} not found`);
  }

  // Get group discussions for this group
  const groupDiscussions = await db.pg.select().from(groupDiscussionTable.pg).where(eq(groupDiscussionTable.pg.group, body.groupId));

  const groupDiscussionsWithDistance = groupDiscussions
    .filter((groupDiscussion) => !!groupDiscussion.startDateTime && !!groupDiscussion.endDateTime)
    .map((groupDiscussion) => ({
      groupDiscussion,
      distance: Math.abs((Date.now() / 1000) - (groupDiscussion.startDateTime!)),
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
  const zoomAccounts = await db.pg.select().from(zoomAccountTable.pg).where(eq(zoomAccountTable.pg.id, groupDiscussion.zoomAccount));
  const zoomAccount = zoomAccounts[0];

  if (!zoomAccount) {
    throw new createHttpError.InternalServerError(`Zoom account ${groupDiscussion.zoomAccount} not found`);
  }

  // Get facilitators and participants
  const facilitatorIds = groupDiscussion.facilitators || [];
  const participantIds = groupDiscussion.participantsExpected || [];

  const facilitators = facilitatorIds.length > 0
    ? await db.pg.select().from(meetPersonTable.pg).where(inArray(meetPersonTable.pg.id, facilitatorIds))
    : [];

  const participants = participantIds.length > 0
    ? await db.pg.select().from(meetPersonTable.pg).where(inArray(meetPersonTable.pg.id, participantIds))
    : [];

  const { meetingNumber, meetingPassword } = parseZoomLink(zoomAccount.meetingLink || '');
  const meetingHostKey = zoomAccount.hostKey || '';

  return {
    type: 'success' as const,
    groupDiscussionId: groupDiscussion.id,
    participants: [
      ...facilitators.map((facilitator) => ({ id: facilitator.id, name: facilitator.name || '', role: 'host' as const })),
      ...participants.map((participant) => ({ id: participant.id, name: participant.name || '', role: 'participant' as const })),
    // eslint-disable-next-line no-nested-ternary
    ].sort((a, b) => ((a.name < b.name) ? -1 : (a.name > b.name) ? 1 : 0)),
    meetingNumber,
    meetingPassword,
    meetingHostKey,
    meetingStartTime: groupDiscussion.startDateTime!,
    meetingEndTime: groupDiscussion.endDateTime!,
  };
});

export const maxDuration = 60;
