import {
  and,
  applicationsRoundTable,
  arrayContains,
  COURSE_ROLE,
  courseRegistrationTable,
  eq,
  courseTable,
  groupDiscussionTable,
  groupSwitchingTable,
  groupTable, inArray, isDiscussionFacilitator, isDiscussionParticipant, meetPersonTable, roundTable, unitTable,
  type Group,
  type GroupSwitching,
  type GroupDiscussion,
  type MeetPerson,
} from '@bluedot/db';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import { trackCustomerIoEvent } from '../../lib/api/customerio';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { parseUnitFallback } from '../../lib/calendar';
import { getDiscussionTimeState, hasEndDateTime, type GroupDiscussionWithEnd } from '../../lib/group-discussions/utils';
import { buildAvailabilityFormUrl, unique } from '../../lib/utils';
import { getUserFromAuthOrThrow, protectedProcedure, router } from '../trpc';

export type DiscussionsAvailable = inferRouterOutputs<typeof groupSwitchingRouter>['discussionsAvailable'];

const switchTypeSchema = z.enum(['Switch group for one unit', 'Switch group permanently']);
export type SwitchType = z.infer<typeof switchTypeSchema>;

export const OPEN_SWITCH_REQUEST_STATUSES = ['Requested', 'Resolve'];

export type PendingSwitchRequestState = {
  /** Discussions the participant has an open one-unit reschedule request out of (and didn't attend anyway). */
  discussionIdsWithPendingReschedule: string[];
  hasPendingGroupSwitchRequest: boolean;
};

type DiscussionsByUnit = Record<string, {
  discussion: GroupDiscussionWithEnd;
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
  groupDiscussions: GroupDiscussionWithEnd[];
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

    const userIsParticipant = isDiscussionParticipant(discussion, [participantId]);
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
          userIsParticipant: (group.participants ?? []).includes(participantId),
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

function getAllowedGroupsForParticipant({
  allGroups,
  participantId,
  participantHumanOpinion,
}: {
  allGroups: Group[];
  participantId: string;
  participantHumanOpinion: string | null;
}): Group[] {
  const opinion = (!participantHumanOpinion || participantHumanOpinion === 'TODO')
    ? 'Neutral'
    : participantHumanOpinion;
  return allGroups.filter((group) => (
    (group.participants ?? []).includes(participantId)
    || (group.whoCanSwitchIntoThisGroup ?? []).includes(opinion)
  ));
}

function calculateRescheduleEligibleUnits(discussionsAvailable: DiscussionsByUnit): Set<string> {
  const eligible = new Set<string>();
  for (const [unitKey, list] of Object.entries(discussionsAvailable)) {
    if (list.some((d) => !d.userIsParticipant)) {
      eligible.add(unitKey);
    }
  }

  return eligible;
}

/**
 * Source of truth for the participant-facing "what can I switch into?" answer.
 */
export function getAvailableGroupsAndDiscussions({
  allGroupsInRound,
  allGroupDiscussionsInRound,
  participantId,
  participantHumanOpinion,
  maxParticipants,
}: {
  allGroupsInRound: Group[];
  allGroupDiscussionsInRound: GroupDiscussionWithEnd[];
  participantId: string;
  participantHumanOpinion: string | null;
  maxParticipants: number | null | undefined;
}) {
  const allowedGroups = getAllowedGroupsForParticipant({ allGroups: allGroupsInRound, participantId, participantHumanOpinion });
  const allowedGroupIds = new Set(allowedGroups.map((g) => g.id));
  const allowedDiscussions = allGroupDiscussionsInRound.filter((d) => allowedGroupIds.has(d.group));

  const { groupsAvailable, discussionsAvailable } = calculateGroupAvailability({
    groupDiscussions: allowedDiscussions,
    groups: allowedGroups,
    maxParticipants,
    participantId,
  });

  return {
    allowedGroups,
    groupsAvailable,
    discussionsAvailable,
    rescheduleEligibleUnits: [...calculateRescheduleEligibleUnits(discussionsAvailable)],
  };
}

export function getPendingSwitchRequestState(
  openSwitchRequests: Pick<GroupSwitching, 'switchType' | 'oldDiscussion'>[],
  attendedDiscussionIds: string[],
): PendingSwitchRequestState {
  const attended = new Set(attendedDiscussionIds);
  return {
    discussionIdsWithPendingReschedule: unique(openSwitchRequests
      .filter((r) => r.switchType === 'Switch group for one unit')
      .flatMap((r) => r.oldDiscussion ?? []))
      .filter((id) => !attended.has(id)),
    hasPendingGroupSwitchRequest: openSwitchRequests.some((r) => r.switchType === 'Switch group permanently'),
  };
}

/** A reschedule out of this discussion is the more specific of the two, so it wins. */
export function getDiscussionPendingSwitch(state: PendingSwitchRequestState, discussionId: string): SwitchType | null {
  if (state.discussionIdsWithPendingReschedule.includes(discussionId)) return 'Switch group for one unit';
  if (state.hasPendingGroupSwitchRequest) return 'Switch group permanently';
  return null;
}

const SWITCH_REQUESTED_EVENT = 'Group switch requested';

async function sendSwitchRequestedAckEmail({
  email, participant, switchType, isManualRequest, notesFromParticipant, oldDiscussion, newDiscussion, oldGroup, newGroup,
}: {
  email: string;
  participant: MeetPerson;
  switchType: SwitchType;
  isManualRequest: boolean;
  notesFromParticipant: string | undefined;
  oldDiscussion: GroupDiscussion | null;
  newDiscussion: GroupDiscussion | null;
  oldGroup: Group | null;
  newGroup: Group | null;
}) {
  if (!participant.applicationsBaseRecordId) {
    throw new Error(`participant ${participant.id} has no course registration`);
  }

  const registration = await db.get(courseRegistrationTable, { id: participant.applicationsBaseRecordId });
  const course = await db.get(courseTable, { id: registration.courseId });

  // One-unit switches don't record the groups, so they come from the discussions
  const [resolvedOldGroup, resolvedNewGroup, unit] = await Promise.all([
    oldGroup ?? (oldDiscussion ? db.getFirst(groupTable, { filter: { id: oldDiscussion.group } }) : null),
    newGroup ?? (newDiscussion ? db.getFirst(groupTable, { filter: { id: newDiscussion.group } }) : null),
    oldDiscussion?.courseBuilderUnitRecordId ? db.getFirst(unitTable, { filter: { id: oldDiscussion.courseBuilderUnitRecordId }, sortBy: 'id' }) : null,
  ]);
  const parsedUnitFallback = parseUnitFallback(oldDiscussion?.unitFallback);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';

  await trackCustomerIoEvent({
    email,
    name: SWITCH_REQUESTED_EVENT,
    data: {
      switchType,
      isManualRequest,
      notesFromParticipant: notesFromParticipant ?? '',
      courseName: course.title,
      courseLink: `${siteUrl}/courses/${course.slug}`,
      oldGroupName: resolvedOldGroup?.groupName ?? undefined,
      newGroupName: resolvedNewGroup?.groupName ?? undefined,
      ...(oldDiscussion && {
        unitNumber: oldDiscussion.unitNumber ?? parsedUnitFallback?.number ?? undefined,
        unitTitle: unit?.title ?? parsedUnitFallback?.title,
        oldDiscussionStartTime: oldDiscussion.startDateTime,
      }),
      newDiscussionStartTime: newDiscussion?.startDateTime,
      availabilityLink: isManualRequest
        ? buildAvailabilityFormUrl({
          email: registration.email,
          utmSource: 'bluedot-group-switch-email',
          courseRegistration: registration,
          roundId: registration.roundId ?? '',
        })
        : undefined,
    },
  });
}

export const groupSwitchingRouter = router({
  discussionsAvailable: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ ctx, input: { roundId } }) => {
      const user = await getUserFromAuthOrThrow(ctx.auth);

      const participant = await db.getFirst(meetPersonTable, { filter: { round: roundId, userId: user.id, role: COURSE_ROLE.PARTICIPANT } });
      if (!participant) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No participant record found for user in this course round' });
      }

      const courseRound = await db.getFirst(roundTable, { filter: { id: roundId }, sortBy: 'id' });
      if (!courseRound) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No course round found' });
      }

      const [allGroupsInRound, allGroupDiscussionsInRound, [applicationsRound]] = await Promise.all([
        db.scan(groupTable, { round: roundId }),
        db.scan(groupDiscussionTable, { round: roundId }).then((rows) => rows.filter(hasEndDateTime)),
        // `roundId` is a Course runner round; intensity lives on the registration's applications round
        participant.applicationsBaseRecordId
          ? db.pg
            .select({ intensity: applicationsRoundTable.pg.intensity })
            .from(courseRegistrationTable.pg)
            .innerJoin(applicationsRoundTable.pg, eq(applicationsRoundTable.pg.id, courseRegistrationTable.pg.roundId))
            .where(eq(courseRegistrationTable.pg.id, participant.applicationsBaseRecordId))
          : [],
      ]);

      const result = getAvailableGroupsAndDiscussions({
        allGroupsInRound,
        allGroupDiscussionsInRound,
        participantId: participant.id,
        participantHumanOpinion: participant.humanOpinion ?? null,
        maxParticipants: courseRound.maxParticipantsPerGroup,
      });

      if (result.allowedGroups.filter((g) => !(g.participants ?? []).includes(participant.id)).length === 0) {
        // eslint-disable-next-line no-console
        console.warn(`[Group switching] Warning for course registration ${participant.id}: No groups allowed to switch into. This is likely due to the "Who can switch into this group" field not including the participant's Human opinion value.`);
      }

      return {
        groupsAvailable: result.groupsAvailable,
        discussionsAvailable: result.discussionsAvailable,
        rescheduleEligibleUnits: result.rescheduleEligibleUnits,
        roundIntensity: applicationsRound?.intensity ?? null,
      };
    }),

  switchGroup: protectedProcedure
    .input(z.object({
      switchType: switchTypeSchema,
      notesFromParticipant: z.string().optional(),
      oldGroupId: z.string().optional(),
      newGroupId: z.string().optional(),
      oldDiscussionId: z.string().optional(),
      newDiscussionId: z.string().optional(),
      isManualRequest: z.boolean(),
      roundId: z.string(),
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
        roundId,
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

      const user = await getUserFromAuthOrThrow(ctx.auth);

      const participant = await db.getFirst(meetPersonTable, {
        filter: { round: roundId, userId: user.id, role: COURSE_ROLE.PARTICIPANT },
      });
      if (!participant) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'No participant record found for user in this course round',
        });
      }

      const { id: participantId } = participant;

      let unitId: string | null = null;
      const switched: { oldDiscussion: GroupDiscussion | null; newDiscussion: GroupDiscussion | null; oldGroup: Group | null; newGroup: Group | null } = {
        oldDiscussion: null, newDiscussion: null, oldGroup: null, newGroup: null,
      };
      let oldGroupId: string | null = null;
      let newGroupId: string | null = null;
      let oldDiscussionId: string | null = null;
      let newDiscussionId: string | null = null;

      const round = await db.getFirst(roundTable, { filter: { id: roundId }, sortBy: 'id' });
      if (!round) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No course round found' });
      }

      const maxParticipants = round.maxParticipantsPerGroup;

      if (isTemporarySwitch) {
        // Error will be thrown here if oldDiscussion is not found
        const [oldDiscussion, newDiscussion] = await Promise.all([
          db.get(groupDiscussionTable, { id: inputOldDiscussionId }),
          !isManualRequest ? db.get(groupDiscussionTable, { id: inputNewDiscussionId }) : null,
        ]);

        if (isDiscussionFacilitator(oldDiscussion, [participantId])
          || (newDiscussion != null && isDiscussionFacilitator(newDiscussion, [participantId]))) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Facilitators cannot switch groups by this method' });
        }

        if (!isDiscussionParticipant(oldDiscussion, [participantId])) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User not found in old discussion' });
        }

        if (newDiscussion != null && isDiscussionParticipant(newDiscussion, [participantId])) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is already expected to attend new discussion' });
        }

        if (newDiscussion && newDiscussion.round !== roundId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'New discussion does not belong to the current course round' });
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
        switched.oldDiscussion = oldDiscussion;
        switched.newDiscussion = newDiscussion;
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

        if (oldGroup && !(oldGroup.participants ?? []).includes(participantId)) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'User is not a member of old group' });
        }

        if ((newGroup?.participants ?? []).includes(participantId)) {
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
          const groupDiscussions = (await db.scan(groupDiscussionTable, { group: newGroup.id })).filter(hasEndDateTime);
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
        switched.oldGroup = oldGroup;
        switched.newGroup = newGroup;
      }

      const recordToCreate = {
        participant: participantId,
        requestStatus: isManualRequest ? 'Resolve' : 'Requested',
        switchType,
        notesFromParticipant: notesFromParticipant ?? null,
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

      sendSwitchRequestedAckEmail({
        email: user.email, participant, switchType, isManualRequest, notesFromParticipant, ...switched,
      }).catch((error: unknown) => slackAlert(env, [`[GroupSwitching] "${SWITCH_REQUESTED_EVENT}" event for participant ${participantId} failed: ${error instanceof Error ? error.message : String(error)}`]));

      return null;
    }),
});
