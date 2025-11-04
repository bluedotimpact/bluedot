import {
  courseRegistrationTable, courseRunnerBucketTable, courseTable, groupDiscussionTable, groupTable, inArray, meetPersonTable, roundTable,
  type Group,
  type GroupDiscussion,
} from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { protectedProcedure, router } from '../trpc';

export type DiscussionsAvailable = inferRouterOutputs<typeof groupSwitchingRouter>['discussionsAvailable'];

type DiscussionsByUnit = Record<string, {
  discussion: GroupDiscussion;
  spotsLeftIfKnown: number | null;
  userIsParticipant: boolean;
  groupName: string;
  hasStarted: boolean;
}[]>;

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

  const discussionsByUnit: DiscussionsByUnit = {};

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

export const groupSwitchingRouter = router({
  discussionsAvailable: protectedProcedure
    .input(z.object({ courseSlug: z.string() }))
    .query(async ({ ctx, input: { courseSlug } }) => {
      const course = await db.get(courseTable, { slug: courseSlug });
      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `No course with slug ${courseSlug} found` });
      }

      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          decision: 'Accept',
          courseId: course.id,
        },
      });

      if (!courseRegistration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No course registration found' });
      }

      const participant = await db.get(meetPersonTable, { applicationsBaseRecordId: courseRegistration.id });

      const roundId = participant.round;

      if (!roundId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No course round found' });
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
        groupsAvailable,
        discussionsAvailable,
      };
    }),
});
