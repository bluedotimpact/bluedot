import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  courseRegistrationTable,
  courseTable,
  groupDiscussionTable,
  groupTable,
  InferSelectModel,
  meetPersonTable,
  roundTable,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import { stablePickCourseRegistration } from '../../../../../lib/utils';

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
type Group = InferSelectModel<typeof groupTable.pg>;

export type GetGroupSwitchingAvailableResponse = {
  type: 'success',
  // TODO make this an array
  groupsAvailabile: Record<string, {
    group: Group;
    spotsLeft: number | null;
    nextDiscussionStartDateTime: number | null;
    userIsParticipant: boolean;
  }>,
  discussionsAvailable: Record<string, {
    discussion: GroupDiscussion
    spotsLeft: number | null;
    userIsParticipant: boolean;
    groupName: string;
  }[]>
};

function formatEnrichedResults({
  groupDiscussions,
  groups,
  maxParticipants,
  participantId,
}: {
  groupDiscussions: GroupDiscussion[];
  groups: Group[];
  maxParticipants: number | null | undefined;
  participantId: string;
}) {
  const groupsById = groups.reduce((acc, group) => {
    acc[group.id] = group;
    return acc;
  }, {} as Record<string, Group>);

  const enrichedGroupDiscussions = groupDiscussions
    .filter((d) => d.unitNumber !== null && d.unitNumber !== undefined)
    .map((d) => {
      const spotsLeft = typeof maxParticipants === 'number'
        ? Math.min(0, maxParticipants - d.participantsExpected.length)
        : null;

      const group = groupsById[d.group];
      const groupName = group?.groupName || 'Group [Unknown]';

      return {
        discussion: d,
        spotsLeft,
        userIsParticipant: d.participantsExpected.includes(participantId),
        groupName,
      };
    });

  const enrichedGroupDiscussionsByUnitNumber = enrichedGroupDiscussions.reduce(
    (acc, enrichedDiscussion) => {
      const unitNumber = enrichedDiscussion.discussion.unitNumber!;
      if (!acc[unitNumber]) {
        acc[unitNumber] = [];
      }
      acc[unitNumber].push(enrichedDiscussion);
      return acc;
    },
    {} as GetGroupSwitchingAvailableResponse['discussionsAvailable'],
  );

  const now = Date.now();
  const enrichedGroupsById = enrichedGroupDiscussions.reduce(
    (acc, { discussion, spotsLeft }) => {
      const groupId = discussion.group;
      const hasNotStarted = discussion.startDateTime * 1000 > now;

      if (!acc[groupId]) {
        const group = groups.find((g) => g.id === groupId)!;
        acc[groupId] = {
          group,
          spotsLeft,
          nextDiscussionStartDateTime: hasNotStarted
            ? discussion.startDateTime
            : null,
          userIsParticipant: group.participants.includes(participantId),
        };
        return acc;
      }

      const spotsLeftValues = [acc[groupId].spotsLeft, spotsLeft].filter(
        (v): v is number => typeof v === 'number',
      );
      acc[groupId].spotsLeft = spotsLeftValues.length
        ? Math.min(...spotsLeftValues)
        : null;

      if (hasNotStarted) {
        const newMin = Math.min(
          acc[groupId].nextDiscussionStartDateTime ?? Infinity,
          discussion.startDateTime,
        );
        acc[groupId].nextDiscussionStartDateTime = newMin !== Infinity ? newMin : null;
      }

      return acc;
    },
    {} as GetGroupSwitchingAvailableResponse['groupsAvailabile'],
  );

  return { enrichedGroupDiscussionsByUnitNumber, enrichedGroupsById };
}

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    groupsAvailabile: z.record(z.object({
      group: z.any(),
      spotsLeft: z.number().nullable(),
      nextDiscussionStartDateTime: z.number().nullable(),
      userIsParticipant: z.boolean(),
    })),
    discussionsAvailable: z.record(z.array(z.object({
      discussion: z.any(),
      spotsLeft: z.number().nullable(),
      userIsParticipant: z.boolean(),
      groupName: z.string(),
    }))),
  }),
}, async (_, { auth, raw }) => {
  const { courseSlug } = raw.req.query;

  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }

  const course = await db.get(courseTable, { slug: courseSlug });
  console.log({ course });

  const courseRegistration = stablePickCourseRegistration(
    await db.scan(courseRegistrationTable, {
      email: auth.email,
      decision: 'Accept',
      courseId: course.id,
    }),
  );
  console.log({ courseRegistration });

  if (!courseRegistration) {
    throw new createHttpError.NotFound('No course registration found');
  }

  const participant = await db.get(meetPersonTable, { applicationsBaseRecordId: courseRegistration.id });
  console.log({ participant });

  const roundId = participant.round;

  const round = await db.get(roundTable, { id: roundId });
  console.log({ round });

  const groups = await db.scan(groupTable, { round: roundId });
  console.log({ groups });

  const groupDiscussions = groups.length ? await db.scan(groupDiscussionTable, {
    OR: groups.map((g) => ({ group: g.id })),
  }) : [];
  console.log({ groupDiscussions });

  const maxParticipants = round.maxParticipantsPerGroup;

  const {
    enrichedGroupDiscussionsByUnitNumber,
    enrichedGroupsById,
  } = formatEnrichedResults({
    groupDiscussions,
    groups,
    maxParticipants,
    participantId: participant.id,
  });

  return {
    type: 'success' as const,
    groupsAvailabile: enrichedGroupsById,
    discussionsAvailable: enrichedGroupDiscussionsByUnitNumber,
  };
});
