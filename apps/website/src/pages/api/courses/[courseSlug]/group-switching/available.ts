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

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
type Group = InferSelectModel<typeof groupTable.pg>;

export type GetGroupSwitchingAvailableResponse = {
  type: 'success',
  groupsAvailable: {
    group: Group;
    spotsLeft: number | null;
    userIsParticipant: boolean;
    allDiscussionsHaveStarted: boolean;
  }[],
  discussionsAvailable: Record<string, {
    discussion: GroupDiscussion
    spotsLeft: number | null;
    userIsParticipant: boolean;
    groupName: string;
    hasStarted: boolean;
  }[]>
};

function calculateGroupAvailability({
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
  const groupsById: Record<string, Group> = {};
  for (const group of groups) {
    groupsById[group.id] = group;
  }

  const discussionsByUnit: GetGroupSwitchingAvailableResponse['discussionsAvailable'] = {};

  const groupData: Record<string, {
    group: Group;
    spotsLeft: number | null;
    userIsParticipant: boolean;
    allDiscussionsHaveStarted: boolean;
  }> = {};

  const now = Date.now();

  for (const discussion of groupDiscussions) {
    // Skip discussions without unit numbers
    // eslint-disable-next-line no-continue
    if (discussion.unitNumber == null) continue;

    const group = groupsById[discussion.group];
    // eslint-disable-next-line no-continue
    if (!group) continue;

    // Calculate spots left for this discussion
    const otherParticipants = discussion.participantsExpected.filter((id) => id !== participantId);
    const spotsLeft = typeof maxParticipants === 'number'
      ? Math.max(0, maxParticipants - otherParticipants.length)
      : null;

    const userIsParticipant = discussion.participantsExpected.includes(participantId);
    const groupName = group.groupName || 'Group [Unknown]';

    // Add to discussions by unit
    const unitKey = discussion.unitNumber.toString();
    if (!discussionsByUnit[unitKey]) {
      discussionsByUnit[unitKey] = [];
    }

    const hasStarted = discussion.startDateTime * 1000 <= now;

    discussionsByUnit[unitKey].push({
      discussion,
      spotsLeft,
      userIsParticipant,
      groupName,
      hasStarted,
    });

    // Update group data
    const groupId = discussion.group;

    if (!groupData[groupId]) {
      // First time seeing this group
      groupData[groupId] = {
        group,
        spotsLeft: !hasStarted ? spotsLeft : null,
        userIsParticipant: group.participants.includes(participantId),
        allDiscussionsHaveStarted: hasStarted,
      };
    } else {
      // Update existing group data
      const existing = groupData[groupId];

      existing.allDiscussionsHaveStarted = existing.allDiscussionsHaveStarted && hasStarted;

      if (!hasStarted) {
        // Update spotsLeft
        if (existing.spotsLeft !== null && spotsLeft !== null) {
          // Clamp spotsLeft to be >= 0
          existing.spotsLeft = Math.max(Math.min(existing.spotsLeft, spotsLeft), 0);
        } else if (spotsLeft !== null) {
          existing.spotsLeft = spotsLeft;
        }
      }
    }
  }

  return {
    discussionsAvailable: discussionsByUnit,
    groupsAvailable: Object.values(groupData),
  };
}

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    groupsAvailable: z.array(z.object({
      group: z.any(),
      spotsLeft: z.number().nullable(),
      userIsParticipant: z.boolean(),
      allDiscussionsHaveStarted: z.boolean(),
    })),
    discussionsAvailable: z.record(z.array(z.object({
      discussion: z.any(),
      spotsLeft: z.number().nullable(),
      userIsParticipant: z.boolean(),
      groupName: z.string(),
      hasStarted: z.boolean(),
    }))),
  }),
}, async (_, { auth, raw }) => {
  const { courseSlug } = raw.req.query;

  if (typeof courseSlug !== 'string') {
    throw new createHttpError.BadRequest('Invalid course slug');
  }

  const course = await db.get(courseTable, { slug: courseSlug });

  const courseRegistration = await db.getFirst(courseRegistrationTable, {
    filter: {
      email: auth.email,
      decision: 'Accept',
      courseId: course.id,
    },
  });

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
    discussionsAvailable,
    groupsAvailable,
  } = calculateGroupAvailability({
    groupDiscussions,
    groups: allowedGroups,
    maxParticipants,
    participantId: participant.id,
  });

  return {
    type: 'success' as const,
    groupsAvailable,
    discussionsAvailable,
  };
});
