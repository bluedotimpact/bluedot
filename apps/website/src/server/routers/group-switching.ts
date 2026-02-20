import {
  and,
  arrayContains,
  courseRegistrationTable, courseRunnerBucketTable, courseTable, groupDiscussionTable,
  groupSwitchingTable,
  groupTable, inArray, meetPersonTable, roundTable,
  type Group,
  type GroupDiscussion,
} from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';

export type DiscussionsAvailable = inferRouterOutputs<typeof groupSwitchingRouter>['discussionsAvailable'];

type DiscussionsByUnit = Record<string, {
  discussion: GroupDiscussion;
  spotsLeftIfKnown: number | null;
  userIsParticipant: boolean;
  groupName: string;
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
  }> = {};

  const currentTimeMs = Date.now();

  for (const discussion of groupDiscussions) {
    // Skip discussions without unit numbers

    if (discussion.unitNumber == null) {
      continue;
    }

    const group = groupsById[discussion.group];

    if (!group) {
      continue;
    }

    // Calculate spots left for this discussion
    const otherParticipants = discussion.participantsExpected.filter((id) => id !== participantId);
    const spotsLeftIfKnown = typeof maxParticipants === 'number'
      ? Math.max(0, maxParticipants - otherParticipants.length)
      : null;

    const userIsParticipant = discussion.participantsExpected.includes(participantId);
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    const groupName = group.groupName || 'Group [Unknown]';

    // Add to discussions by unit
    const unitKey = discussion.unitNumber.toString();
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    if (!discussionsByUnit[unitKey]) {
      discussionsByUnit[unitKey] = [];
    }

    const timeState = getDiscussionTimeState({ discussion, currentTimeMs });
    const isTooLateToSwitchTo = timeState === 'live' || timeState === 'ended';

    if (!isTooLateToSwitchTo || userIsParticipant) {
      discussionsByUnit[unitKey].push({
        discussion,
        spotsLeftIfKnown,
        userIsParticipant,
        groupName,
      });

      // Update group data
      const groupId = discussion.group;
      if (!groupData[groupId]) {
        // First time seeing this group
        groupData[groupId] = {
          group,
          spotsLeftIfKnown,
          userIsParticipant: group.participants.includes(participantId),
        };
      } else {
        // Update existing group data - take minimum spots across all discussions
        const existing = groupData[groupId];
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
      if (!participant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No participant found for this course registration' });
      }

      const roundId = participant.round;
      if (!roundId) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Participant does not have a round ID' });
      }

      const courseRound = await db.get(roundTable, { id: roundId });
      if (!courseRound) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No course round found' });
      }

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
            (bucket.groups ?? []).forEach((groupId) => {
              allowedGroupIds.add(groupId);
            });
          });
        }

        return allGroups.filter((group) => allowedGroupIds.has(group.id));
      };

      const allowedGroups = await getGroupsAllowedToSwitchInto();

      if (allowedGroups.filter((g) => !g.participants.includes(participant.id)).length === 0) {
        // eslint-disable-next-line no-console
        console.warn(`[Group switching] Warning for course registration ${participant.id} (Course runner base id): No groups allowed to switch into. This is likely due to "Who can switch into this group" field on the user's group not being set correctly.`);
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

  switchGroup: protectedProcedure
    .input(z.object({
      switchType: z.enum(['Switch group for one unit', 'Switch group permanently']),
      notesFromParticipant: z.string().optional(),
      oldGroupId: z.string().optional(),
      newGroupId: z.string().optional(),
      oldDiscussionId: z.string().optional(),
      newDiscussionId: z.string().optional(),
      isManualRequest: z.boolean(),
      courseSlug: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const {
        switchType,
        oldGroupId: inputOldGroupId,
        newGroupId: inputNewGroupId,
        oldDiscussionId: inputOldDiscussionId,
        newDiscussionId: inputNewDiscussionId,
        notesFromParticipant,
        isManualRequest,
        courseSlug,
      } = input;

      const isTemporarySwitch = switchType === 'Switch group for one unit';

      if (isTemporarySwitch && !inputOldDiscussionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'oldDiscussionId is required when switching for one unit',
        });
      }

      if (isTemporarySwitch && !isManualRequest && !inputNewDiscussionId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'newDiscussionId is required when switching for one unit, unless requesting a manual switch',
        });
      }

      if (!isTemporarySwitch && !isManualRequest && !inputNewGroupId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'newGroupId is required when switching groups permanently, unless requesting a manual switch',
        });
      }

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
      const { id: participantId, round: roundId } = participant;

      if (!roundId) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No course round found' });
      }

      let unitId: string | null = null;
      let oldGroupId: string | null = null;
      let newGroupId: string | null = null;
      let oldDiscussionId: string | null = null;
      let newDiscussionId: string | null = null;

      const round = await db.get(roundTable, { id: roundId });
      const maxParticipants = round.maxParticipantsPerGroup;

      if (isTemporarySwitch) {
        // Error will be thrown here if oldDiscussion is not found
        const [oldDiscussion, newDiscussion] = await Promise.all([
          db.get(groupDiscussionTable, { id: inputOldDiscussionId }),
          !isManualRequest ? db.get(groupDiscussionTable, { id: inputNewDiscussionId }) : null,
        ]);

        if (oldDiscussion.facilitators.includes(participantId) || newDiscussion?.facilitators.includes(participantId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Facilitators cannot switch groups by this method' });
        }

        if (!oldDiscussion.participantsExpected.includes(participantId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User not found in old discussion' });
        }

        if (newDiscussion?.participantsExpected.includes(participantId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is already expected to attend new discussion' });
        }

        if (newDiscussion && oldDiscussion.unit !== newDiscussion.unit) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Old and new discussion must be on the same course unit' });
        }

        if (newDiscussion && !isManualRequest && typeof maxParticipants === 'number') {
          const spotsLeftIfKnown = Math.max(0, maxParticipants - newDiscussion.participantsExpected.length);
          if (spotsLeftIfKnown === 0) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selected discussion has no spots remaining' });
          }
        }

        unitId = oldDiscussion.unit;
        newGroupId = newDiscussion?.group ?? null;
        oldDiscussionId = inputOldDiscussionId!;
        newDiscussionId = inputNewDiscussionId ?? null;
      } else {
        // Error will be thrown here if oldGroup is not found
        const [oldGroup, newGroup, discussionsFacilitatedByParticipant] = await Promise.all([
          inputOldGroupId ? db.get(groupTable, { id: inputOldGroupId }) : null,
          !isManualRequest ? db.get(groupTable, { id: inputNewGroupId }) : null,
          db.pg
            .select()
            .from(groupDiscussionTable.pg)
            .where(and(
              arrayContains(groupDiscussionTable.pg.facilitators, [participantId]),
              inArray(
                groupDiscussionTable.pg.group,
                [inputOldGroupId, inputNewGroupId].filter((v): v is string => v !== null),
              ),
            )),
        ]);

        if (discussionsFacilitatedByParticipant.length) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Facilitators cannot switch groups by this method' });
        }

        if (oldGroup && !oldGroup.participants.includes(participantId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is not a member of old group' });
        }

        if (newGroup?.participants.includes(participantId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is already a member of new group' });
        }

        if (oldGroup && oldGroup.round !== participant.round) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Old group does not match the course round the user is registered for' });
        }

        if (newGroup && newGroup.round !== participant.round) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'New group does not match the course round the user is registered for' });
        }

        if (newGroup && !isManualRequest && typeof maxParticipants === 'number') {
          // Calculate spots left based on the minimum spots across all discussions in the group
          // This matches the logic in available.ts
          const groupDiscussions = await db.scan(groupDiscussionTable, { group: newGroup.id });
          const spotsLeftIfKnownValues = groupDiscussions
            .map((d) => Math.max(0, maxParticipants - d.participantsExpected.filter((pId) => pId !== participantId).length))
            .filter((v) => typeof v === 'number');

          const spotsLeftIfKnown = spotsLeftIfKnownValues.length ? Math.min(...spotsLeftIfKnownValues) : null;
          if (spotsLeftIfKnown === 0) {
            throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selected group has no spots remaining' });
          }
        }

        oldGroupId = oldGroup?.id ?? null;
        newGroupId = newGroup?.id ?? null;
      }

      const recordToCreate = {
        participant: participantId,
        requestStatus: isManualRequest ? 'Resolve' : 'Requested',
        switchType,
        notesFromParticipant,
        oldGroup: oldGroupId,
        newGroup: newGroupId,
        // Note: The reason the groupIds are values and discussionIds are single-element
        // arrays is just due to a mistake in setting up the db scheme. TODO fix this,
        // but in the meantime this does insert correctly as is.
        oldDiscussion: oldDiscussionId ? [oldDiscussionId] : [],
        newDiscussion: newDiscussionId ? [newDiscussionId] : [],
        unit: unitId,
        manualRequest: isManualRequest,
      };

      await db.insert(groupSwitchingTable, recordToCreate);

      return null;
    }),
});
