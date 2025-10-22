import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  courseRegistrationTable,
  courseRunnerBucketTable,
  courseTable,
  groupDiscussionTable,
  groupTable,
  inArray,
  InferSelectModel,
  meetPersonTable,
  roundTable,
} from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import env from '../../../../../lib/api/env';

type GroupDiscussion = InferSelectModel<typeof groupDiscussionTable.pg>;
type Group = InferSelectModel<typeof groupTable.pg>;

export type GetGroupSwitchingAvailableResponse = {
  type: 'success',
  groupsAvailable: {
    group: Group;
    spotsLeftIfKnown: number | null;
    userIsParticipant: boolean;
    allDiscussionsHaveStarted: boolean;
  }[],
  discussionsAvailable: Record<string, {
    discussion: GroupDiscussion
    spotsLeftIfKnown: number | null;
    userIsParticipant: boolean;
    groupName: string;
    hasStarted: boolean;
  }[]>
};

export function calculateGroupAvailability({
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
    spotsLeftIfKnown: number | null;
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
    const spotsLeftIfKnown = typeof maxParticipants === 'number'
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
      spotsLeftIfKnown,
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
        spotsLeftIfKnown: !hasStarted ? spotsLeftIfKnown : null,
        userIsParticipant: group.participants.includes(participantId),
        allDiscussionsHaveStarted: hasStarted,
      };
    } else {
      // Update existing group data
      const existing = groupData[groupId];

      existing.allDiscussionsHaveStarted = existing.allDiscussionsHaveStarted && hasStarted;

      if (!hasStarted) {
        // Update spotsLeftIfKnown
        if (existing.spotsLeftIfKnown !== null && spotsLeftIfKnown !== null) {
          existing.spotsLeftIfKnown = Math.min(existing.spotsLeftIfKnown, spotsLeftIfKnown);
        } else if (spotsLeftIfKnown !== null) {
          existing.spotsLeftIfKnown = spotsLeftIfKnown;
        }
      }
    }
  }

  return {
    discussionsAvailable: discussionsByUnit,
    groupsAvailable: Object.values(groupData),
  };
}

/**
 * Return all the groups (for permanent switches) and discussions (for temporary switches to another group)
 * that are available for a user to switch into.
 */
export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    groupsAvailable: z.array(z.object({
      group: z.any(),
      spotsLeftIfKnown: z.number().nullable(),
      userIsParticipant: z.boolean(),
      allDiscussionsHaveStarted: z.boolean(),
    })),
    discussionsAvailable: z.record(z.array(z.object({
      discussion: z.any(),
      spotsLeftIfKnown: z.number().nullable(),
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

  const courseRound = await db.get(roundTable, { id: roundId });

  /**
   * Get groups the user is allowed to switch to:
   * 1. Get all the groups in this round of the course. Context: Groups in the same
   * round are on a synchronised schedule (e.g. unit 1 of the course will be discussed
   * by all groups at some point during the same week). A participant could switch to
   * any group in the same round and still complete the course in the right order.
   * 2. Look up the participant's assigned buckets. A bucket defines a set of groups the
   * participant is *allowed* to automatically switch between. This is desirable to have
   * e.g. one bucket for recent graduates, and one for more experienced professionals within
   * the same round of a course.
   * 3. Return all groups that are associated with those buckets
   */
  const getGroupsAllowedToSwitchInto = async () => {
    const allGroups = await db.scan(groupTable, { round: roundId });
    const participantGroupIds = allGroups.filter((g) => g.participants.includes(participant.id)).map((g) => g.id);

    // Explicitly allow groups the user is already in
    const allowedGroupIds = new Set<string>(participantGroupIds);

    if (participant.buckets && participant.buckets.length > 0) {
      const bucketsOfAllowedGroups = await db.pg
        .select()
        .from(courseRunnerBucketTable.pg)
        .where(inArray(courseRunnerBucketTable.pg.id, participant.buckets));

      bucketsOfAllowedGroups.forEach((bucket) => {
        bucket.groups.forEach((groupId) => {
          allowedGroupIds.add(groupId);
        });
      });
    }

    return allGroups.filter((group) => allowedGroupIds.has(group.id));
  };
  const allowedGroups = await getGroupsAllowedToSwitchInto();

  if (allowedGroups.filter((g) => !g.participants.includes(participant.id)).length === 0) {
    await slackAlert(env, [
      `[Group switching] Warning for course registration ${participant.id} (Course runner base id): No groups allowed to switch into. This is likely due to "Who can switch into this group" field on the user's group not being set correctly.`,
    ]);
  }

  const allowedGroupDiscussions = allowedGroups.length ? await db.scan(groupDiscussionTable, {
    OR: allowedGroups.map((g) => ({ group: g.id })),
  }) : [];

  const maxParticipants = courseRound.maxParticipantsPerGroup;

  const {
    discussionsAvailable,
    groupsAvailable,
  } = calculateGroupAvailability({
    groupDiscussions: allowedGroupDiscussions,
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
