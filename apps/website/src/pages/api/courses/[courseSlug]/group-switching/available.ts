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
        ? Math.max(0, maxParticipants - d.participantsExpected.filter((pId) => pId !== participantId).length)
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

  const courseRegistration = stablePickCourseRegistration(
    await db.scan(courseRegistrationTable, {
      email: auth.email,
      decision: 'Accept',
      courseId: course.id,
    }),
  );

  if (!courseRegistration) {
    throw new createHttpError.NotFound('No course registration found');
  }

  const participant = await db.get(meetPersonTable, { applicationsBaseRecordId: courseRegistration.id });

  const roundId = participant.round;

  const round = await db.get(roundTable, { id: roundId });

  const groups = await db.scan(groupTable, { round: roundId });

  const groupDiscussions = groups.length ? await db.scan(groupDiscussionTable, {
    OR: groups.map((g) => ({ group: g.id })),
  }) : [];

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
