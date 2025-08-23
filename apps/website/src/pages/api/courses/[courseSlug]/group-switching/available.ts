import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  courseRegistrationTable,
  courseTable,
  eq,
  groupDiscussionTable,
  groupTable,
  InferSelectModel,
  meetCourseTable,
  roundTable,
  sql,
  unitTable,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

// TODO
// Notes:
// - In designs, these are always attached to a groupDiscussion, so we can rely on having the groupDiscussion
// - For permanently switching groups, we still need the ability to get the group a user is in, independent of the groupDiscussion, because this may be a discussion they switched to?
// - Required for switch group permanently:
//   - For lookup:
//     - The other groups that are available in this round. Ideal normalised path: course slug + user => course registration (participant) => round => groups
//       - Current possible path: None:
//         - Need to add COURSE_RUNNER course registration table
//         - Need to add round to COURSE_RUNNER course registration table
//         - Can already look up groups from round, via the group table
//     - The group they are in. Ideal path: find in code based on participants
//         - Need to add participants to groupTable
//   - For display (of groups):
//     - Group name (includes facilitator name)
//       - Need to add "Group name" to groupTable
//     - NEXT meeting time that they are attending. Look up next group discussion (i.e. order by start time, regardless of which unit we are on)
//       - Currently possible, via group field on groupDiscussion
//     - Spots left. Ideal path: Group => round
//       - Use the round, which we will already have from the lookup
//       - Need to add maxParticipants column to round
//     - Stretch: Which units they are already in this group for. Ideal path: Group => group discussions where participants (emails) contains
//       - Look up all group discussions the user is participating in
// - Required for switch group once:
//   - For lookup:
//     - All group discussions for this unit. Ideal path: Course slug + user => course registration (participant) => round => group discussions given unit id
//       - Current possible path, given the fields added above: Course slug + user => course registration (participant) => round => groups => group discussions given unit id
//     - The group discussion they are in. Ideal path: find in code based on participant emails
//   - For display (of group discussions):
//     - Group name
//     - Meeting time for this unit. Look up group discussion for this exact unit
//     - Spots left. Ideal path: Group => round
// - Return format:
//   - Notes on ultimate request to group switching:
//     - New group is always set, new discussion and unit are only set if switching temporarily
//   - Return format (given courseSlug):
//     - groups:
//       - nextMeetingStart
//       - spotsLeft
//       - group
//     - discussions:
//       - unit:
//         - maybe include unit itself?
//         - discussion
//           - includes group, can be used to look up name
//         - spotsLeft
//         - meetingStart
//
// - MVP for testing
//   - Hardcode results based on What the fish? values, but use the right data format
//   - THOROUGHLY test switching itself works
//   - Then add the required fields to actually fetch these

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
type Group = InferSelectModel<typeof groupTable.pg> & { groupName: string }; // TODO actually add groupName

export type GetGroupSwitchingAvailableResponse = {
  type: 'success',
  maxParticipantsPerGroup: number;
  groupsAvailabile: Record<string, {
    group: Group;
    /** min(spotsLeft) across all group discussions */
    spotsLeft: number;
    nextDiscussionStartDateTime: number;
  }>,
  discussionsAvailable: Record<string, GroupDiscussion[]>
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    maxParticipantsPerGroup: z.number(),
    groupsAvailabile: z.record(z.object({
      group: z.any(),
      spotsLeft: z.number(),
      nextDiscussionStartDateTime: z.number().nullable(),
    })),
    discussionsAvailable: z.record(z.array(z.any())),
  }),
}, async (body, { auth, raw }) => {
  const { courseSlug } = raw.req.query;

  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }

  // TODO use auth to look up round

  // TODO look up round from course registration
  const roundId = 'reckOWl4lLXLJTbaS';

  const rawRound = await db.get(roundTable, { id: roundId });
  const round = {
    ...rawRound,
    maxParticipantsPerGroup: 10, // TODO use fldoIzHNm8NzjAefW
  };

  const rawGroups = await db.scan(groupTable, { round: roundId });
  const groups = rawGroups.map((g) => ({
    ...g,
    groupName: { recM4vjtRKQOOkYYB: 'Group 01 - Freddy Flounder', recz0js0GhteOj0Y0: 'Group 02 - Cara Clownfish' }[g.id],
  })) as Group[];

  const rawGroupDiscussions = await db.scan(groupDiscussionTable, {
    OR: groups.map((g) => ({ group: g.id })),
  });
  const groupDiscussions = rawGroupDiscussions.map((gd, idx) => ({
    ...gd,
    unitNumber: idx + 1,
  }));

  const now = Date.now();
  const enrichedGroupsById = groupDiscussions.reduce((acc, discussion) => {
    const groupId = discussion.group;

    const spotsLeft = round.maxParticipantsPerGroup - discussion.participantsExpected.length;
    const hasNotStarted = discussion.startDateTime * 1000 > now;

    if (!acc[groupId]) {
      acc[groupId] = {
        group: (groups.find((g) => g.id === groupId))!,
        spotsLeft,
        nextDiscussionStartDateTime: hasNotStarted ? discussion.startDateTime : null,
      };
      return acc;
    }

    acc[groupId].spotsLeft = Math.min(acc[groupId].spotsLeft, spotsLeft);

    if (hasNotStarted) {
      acc[groupId].nextDiscussionStartDateTime = Math.min(
        acc[groupId].nextDiscussionStartDateTime ?? Infinity,
        discussion.startDateTime,
      );
    }

    return acc;
  }, {} as Record<string, {
    group: Group;
    spotsLeft: number;
    nextDiscussionStartDateTime: number | null;
  }>);

  const groupDiscussionsByUnitNumber = groupDiscussions.reduce((acc, d) => {
    if (d.unitNumber in [null, undefined]) return acc;

    (acc[d.unitNumber] ??= []).push(d);

    return acc;
  }, {} as Record<string, GroupDiscussion[]>);

  return {
    type: 'success' as const,
    maxParticipantsPerGroup: round.maxParticipantsPerGroup,
    groupsAvailabile: enrichedGroupsById,
    discussionsAvailable: groupDiscussionsByUnitNumber,
  };
});
