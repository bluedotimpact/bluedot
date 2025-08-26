import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  courseRegistrationTable,
  courseRunnerBucketTable,
  courseTable,
  groupDiscussionTable,
  groupTable,
  InferSelectModel,
  meetPersonTable,
  roundTable,
  arrayOverlaps,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import { stablePickCourseRegistration } from '../../../../../lib/utils';

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
type Group = InferSelectModel<typeof groupTable.pg>;

export type GetGroupSwitchingAvailableResponse = {
  type: 'success',
  groupsAvailable: {
    group: Group;
    spotsLeft: number | null;
    nextDiscussionStartDateTime: number | null;
    userIsParticipant: boolean;
  }[],
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
        const group = groups.find((g) => g.id === groupId);

        if (!group) return acc; // Not expected to ever happen

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
    {} as Record<string, GetGroupSwitchingAvailableResponse['groupsAvailable'][0]>,
  );

  return { enrichedGroupDiscussionsByUnitNumber, enrichedGroups: Object.values(enrichedGroupsById) };
}

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    groupsAvailable: z.array(z.object({
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

  if (!roundId) {
    throw new createHttpError.NotFound('No course round found');
  }

  const round = await db.get(roundTable, { id: roundId });

  /**
   * Get groups the user is allowed to switch to.
   *
   * KNOWN ISSUE: Ideally this would get the buckets that the participant is a member of,
   * and then look up groups that allow that bucket. Currently the Buckets table in the
   * course runner base only has the People in the bucket as a list of names like "John Doe | AI Alignment (2024 Mar)",
   * so we can't reliably look up by participant id.
   *
   * WORKAROUND: Look up the group (should be one group, but support many) the user is currently in, then look up
   * groups that share a bucket with that group. Assume that if the user is allowed in their current group, they
   * will be allowed in these groups that share a bucket.
   */
  const getAllowedGroups = async () => {
    const allGroups = await db.scan(groupTable, { round: roundId });

    const participantGroups = allGroups.filter((g) => g.participants.includes(participant.id));

    const participantGroupIds = participantGroups.map((g) => g.id);
    if (!participantGroupIds.length) {
      return [];
    }

    const allowedBuckets = await db.pg
      .select()
      .from(courseRunnerBucketTable.pg)
      .where(arrayOverlaps(courseRunnerBucketTable.pg.groups, participantGroupIds));

    const allowedGroupIds = new Set<string>();
    allowedBuckets.forEach((bucket) => {
      bucket.groups.forEach((groupId) => {
        allowedGroupIds.add(groupId);
      });
    });

    return allGroups.filter((group) => allowedGroupIds.has(group.id));
  };
  const allowedGroups = await getAllowedGroups();

  const groupDiscussions = allowedGroups.length ? await db.scan(groupDiscussionTable, {
    OR: allowedGroups.map((g) => ({ group: g.id })),
  }) : [];

  const maxParticipants = round.maxParticipantsPerGroup;

  const {
    enrichedGroupDiscussionsByUnitNumber,
    enrichedGroups,
  } = formatEnrichedResults({
    groupDiscussions,
    groups: allowedGroups,
    maxParticipants,
    participantId: participant.id,
  });

  return {
    type: 'success' as const,
    groupsAvailable: enrichedGroups,
    discussionsAvailable: enrichedGroupDiscussionsByUnitNumber,
  };
});
