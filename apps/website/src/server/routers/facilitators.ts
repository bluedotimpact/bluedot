import {
  and,
  arrayContains,
  arrayOverlaps,
  asc,
  COURSE_ROLE,
  courseFeedbackTable,
  courseRegistrationTable,
  courseTable,
  eq,
  facilitatorDiscussionSwitchingTable,
  groupDiscussionTable,
  groupTable,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  lt,
  meetPersonTable,
  notInArray,
  or,
  peerFeedbackTable,
  roundTable,
  unitTable,
  userTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { hasEndDateTime, isGroupFacilitator, type GroupDiscussionWithEnd } from '../../lib/group-discussions/utils';
import { getUserFromAuthOrThrow, protectedProcedure, router } from '../trpc';
import { getFieldOptions } from '../airtableFieldOptions';
import { postToFacilitatorCommunity } from '../../lib/api/facilitatorCommunitySlack';
import {
  buildCoverMessage,
  isAvailableThroughout,
  MAX_TAGGED_FACILITATORS,
  pickFacilitatorsToTag,
  slackUserIdFromProfileUrl,
  toSlackMrkdwn,
  type CoverMessageDetails,
} from '../../lib/facilitatorCover';
import { ROUTES } from '../../lib/routes';

// Options whose Airtable name starts with "[!]" are "actionable" — flagging the participant
// for follow-up. The marker (and surrounding whitespace) is stripped before display on the client.
const ACTIONABLE_MARKER = '[!]';

type FollowUpOption = { id: string; name: string; label: string; actionable: boolean };

const getNextStepsOptions = async (): Promise<FollowUpOption[]> => {
  const { baseId, tableId } = peerFeedbackTable.airtable;
  const fieldId = peerFeedbackTable.airtableFieldMap.get('nextSteps');

  if (!fieldId) {
    throw new Error('peerFeedbackTable.airtableFieldMap is missing a mapping for nextSteps');
  }

  const options = await getFieldOptions(baseId, tableId, fieldId);
  return options.map((o) => {
    const actionable = o.name.startsWith(ACTIONABLE_MARKER);
    return {
      id: o.id,
      name: o.name,
      label: actionable ? o.name.slice(ACTIONABLE_MARKER.length).trim() : o.name,
      actionable,
    };
  });
};

const getFacilitator = async (roundId: string, userId: string) => {
  const facilitator = await db.getFirst(meetPersonTable, {
    filter: { round: roundId, userId, role: COURSE_ROLE.FACILITATOR },
  });
  if (!facilitator) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'No facilitator found for this round' });
  }

  return facilitator;
};

async function verifyFacilitatorById(meetPersonId: string, ctx: { auth: { sub: string } }) {
  const [user, meetPerson] = await Promise.all([
    getUserFromAuthOrThrow(ctx.auth),
    db.getFirst(meetPersonTable, {
      filter: { id: meetPersonId },
    }),
  ]);

  if (!meetPerson || meetPerson.role !== COURSE_ROLE.FACILITATOR) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Not found' });
  }

  if (meetPerson.userId !== user.id && user.isAdmin !== true) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Not found' });
  }

  return meetPerson;
}

// A meetPerson maps to one application, but can facilitate several groups within its round, and may
// have substituted in other rounds' groups. The feedback form spans all of them.
// A group counts if the person is its current facilitator, or if they attended one of its discussions
// under this facilitator registration: the group may since have been handed to someone else, or they
// may have covered sessions as a substitute. Attendance is also what their pay is calculated from.
async function getGroupsForFacilitator(meetPerson: { id: string; attendedDiscussions: string[] | null }) {
  const attendedDiscussionIds = meetPerson.attendedDiscussions ?? [];
  const attendedGroupIds = attendedDiscussionIds.length > 0
    ? (await db.pg
      .select({ group: groupDiscussionTable.pg.group })
      .from(groupDiscussionTable.pg)
      .where(inArray(groupDiscussionTable.pg.id, attendedDiscussionIds)))
      .map((d) => d.group)
    : [];

  const isCurrentFacilitator = arrayContains(groupTable.pg.facilitator, [meetPerson.id]);
  const groups = await db.pg
    .select({
      id: groupTable.pg.id, groupName: groupTable.pg.groupName, round: groupTable.pg.round, participants: groupTable.pg.participants,
    })
    .from(groupTable.pg)
    .where(attendedGroupIds.length > 0
      ? or(isCurrentFacilitator, inArray(groupTable.pg.id, attendedGroupIds))
      : isCurrentFacilitator)
    // Deterministic group order
    .orderBy(asc(groupTable.pg.groupName), asc(groupTable.pg.id));
  if (groups.length === 0) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'No group found for this facilitator' });
  }

  return groups;
}

async function getDropInIdsForGroups(groupIds: string[], participantIds: string[]) {
  if (groupIds.length === 0) return [];

  const discussions = await db.pg
    .select({ attendees: groupDiscussionTable.pg.attendees })
    .from(groupDiscussionTable.pg)
    .where(inArray(groupDiscussionTable.pg.group, groupIds));
  const participantSet = new Set(participantIds);
  const candidateSet = new Set<string>();
  for (const d of discussions) {
    for (const id of d.attendees ?? []) {
      if (!participantSet.has(id)) candidateSet.add(id);
    }
  }

  if (candidateSet.size === 0) return [];

  // Exclude facilitators (including the current one and co-facilitators who joined a session)
  const candidates = [...candidateSet];
  const rows = await db.pg
    .select({ id: meetPersonTable.pg.id })
    .from(meetPersonTable.pg)
    .where(and(inArray(meetPersonTable.pg.id, candidates), eq(meetPersonTable.pg.role, COURSE_ROLE.PARTICIPANT)));
  return rows.map((r) => r.id);
}

async function getOrCreateCourseFeedback(meetPerson: { id: string; round: string | null; courseFeedback: string[] | null }) {
  const existingId = meetPerson.courseFeedback?.[0];
  if (existingId) {
    const existing = await db.getFirst(courseFeedbackTable, { filter: { id: existingId }, sortBy: 'id' });
    if (existing) return existing;
  }

  const created = await db.insert(courseFeedbackTable, {
    person: [meetPerson.id],
    round: meetPerson.round ? [meetPerson.round] : [],
  });
  await db.update(meetPersonTable, { id: meetPerson.id, courseFeedback: [created.id] });
  return created;
}

const discussionInput = z.object({
  roundId: z.string(),
  groupId: z.string(),
  discussionId: z.string(),
});

// The caller facilitates this discussion, and it hasn't started yet
async function getUpcomingDiscussionForFacilitator(
  { roundId, groupId, discussionId }: z.infer<typeof discussionInput>,
  ctx: { auth: { sub: string } },
) {
  const user = await getUserFromAuthOrThrow(ctx.auth);
  const facilitator = await getFacilitator(roundId, user.id);
  if (!(facilitator.expectedDiscussionsFacilitator ?? []).includes(discussionId)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitator is not allowed to manage this discussion' });
  }

  const discussion = await db.getFirst(groupDiscussionTable, { filter: { id: discussionId } });
  if (!discussion || discussion.group !== groupId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Discussion does not belong to the specified group' });
  }

  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (discussion.startDateTime <= nowInSeconds) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Cannot change facilitator for a discussion that has already started' });
  }

  return { facilitator, discussion };
}

async function getCoverableDiscussion(input: z.infer<typeof discussionInput>, ctx: { auth: { sub: string } }) {
  const { facilitator, discussion } = await getUpcomingDiscussionForFacilitator(input, ctx);
  if (!hasEndDateTime(discussion)) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Discussion has no end time' });
  }

  return { facilitator, discussion };
}

type CoverCandidate = { id: string; name: string; slackUserId: string };

/**
 * Other facilitators in the round with a Slack account and no clashing discussion, split by whether
 * their weekly availability covers the discussion.
 */
async function getCoverCandidates({
  roundId, requesterId, startTimeSeconds, endTimeSeconds,
}: { roundId: string; requesterId: string; startTimeSeconds: number; endTimeSeconds: number }) {
  const withSlack = (await db.pg
    .select({
      id: meetPersonTable.pg.id,
      name: meetPersonTable.pg.name,
      userId: meetPersonTable.pg.userId,
      registrationId: meetPersonTable.pg.applicationsBaseRecordId,
      slackProfileUrl: meetPersonTable.pg.slackProfileUrl,
    })
    .from(meetPersonTable.pg)
    .where(and(eq(meetPersonTable.pg.round, roundId), eq(meetPersonTable.pg.role, COURSE_ROLE.FACILITATOR))))
    .filter((f) => f.id !== requesterId)
    .flatMap((f) => {
      const slackUserId = slackUserIdFromProfileUrl(f.slackProfileUrl);
      return slackUserId ? [{ ...f, slackUserId }] : [];
    });

  const registrationIds = withSlack.flatMap((f) => (f.registrationId ? [f.registrationId] : []));
  const registrations = registrationIds.length > 0
    ? await db.pg
      .select({
        id: courseRegistrationTable.pg.id,
        decision: courseRegistrationTable.pg.decision,
        availabilityIntervalsUTC: courseRegistrationTable.pg.availabilityIntervalsUTC,
      })
      .from(courseRegistrationTable.pg)
      .where(inArray(courseRegistrationTable.pg.id, registrationIds))
    : [];
  const registrationById = new Map(registrations.map((r) => [r.id, r]));
  const facilitators = withSlack.filter((f) => registrationById.get(f.registrationId ?? '')?.decision !== 'Withdrawn');
  if (facilitators.length === 0) return { free: [], noClash: [] };

  // A facilitator has one meetPerson per round, and their sessions in other rounds clash too
  const candidateIdByUserId = new Map(facilitators.flatMap((f) => (f.userId ? [[f.userId, f.id] as const] : [])));
  const otherRoundPeople = candidateIdByUserId.size > 0
    ? await db.pg
      .select({ id: meetPersonTable.pg.id, userId: meetPersonTable.pg.userId })
      .from(meetPersonTable.pg)
      .where(inArray(meetPersonTable.pg.userId, [...candidateIdByUserId.keys()]))
    : [];
  const candidateIdByMeetPersonId = new Map([
    ...facilitators.map((f) => [f.id, f.id] as const),
    ...otherRoundPeople.map((p) => [p.id, candidateIdByUserId.get(p.userId!)!] as const),
  ]);
  const meetPersonIds = [...candidateIdByMeetPersonId.keys()];

  const clashingDiscussions = await db.pg
    .select({ facilitators: groupDiscussionTable.pg.facilitators, participantsExpected: groupDiscussionTable.pg.participantsExpected })
    .from(groupDiscussionTable.pg)
    .where(and(
      or(
        arrayOverlaps(groupDiscussionTable.pg.facilitators, meetPersonIds),
        arrayOverlaps(groupDiscussionTable.pg.participantsExpected, meetPersonIds),
      ),
      lt(groupDiscussionTable.pg.startDateTime, endTimeSeconds),
      or(
        gt(groupDiscussionTable.pg.endDateTime, startTimeSeconds),
        and(isNull(groupDiscussionTable.pg.endDateTime), gte(groupDiscussionTable.pg.startDateTime, startTimeSeconds)),
      ),
    ));
  const clashingCandidateIds = new Set(clashingDiscussions
    .flatMap((d) => [...d.facilitators, ...(d.participantsExpected ?? [])])
    .map((id) => candidateIdByMeetPersonId.get(id)));

  const free: CoverCandidate[] = [];
  const noClash: CoverCandidate[] = [];
  for (const f of facilitators.filter((c) => !clashingCandidateIds.has(c.id))) {
    const availabilityIntervalsUTC = registrationById.get(f.registrationId ?? '')?.availabilityIntervalsUTC ?? null;
    const candidate = { id: f.id, name: f.name ?? '', slackUserId: f.slackUserId };
    (isAvailableThroughout({ availabilityIntervalsUTC, startTimeSeconds, endTimeSeconds }) ? free : noClash).push(candidate);
  }

  return { free, noClash };
}

async function getCoverMessageDetails({
  facilitator, discussion, roundId, groupId, tagged, moreFreeThanTagged,
}: {
  facilitator: { name: string | null; slackProfileUrl: string | null };
  discussion: GroupDiscussionWithEnd;
  roundId: string;
  groupId: string;
  tagged: { free: CoverCandidate[]; noClash: CoverCandidate[] };
  moreFreeThanTagged: boolean;
}): Promise<CoverMessageDetails> {
  const [group, round, unit] = await Promise.all([
    db.getFirst(groupTable, { filter: { id: groupId } }),
    db.getFirst(roundTable, { filter: { id: roundId }, sortBy: 'id' }),
    discussion.courseBuilderUnitRecordId
      ? db.getFirst(unitTable, { filter: { id: discussion.courseBuilderUnitRecordId }, sortBy: 'id' })
      : null,
  ]);
  const course = round?.course ? await db.getFirst(courseTable, { filter: { id: round.course }, sortBy: 'id' }) : null;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bluedot.org';
  const toPerson = ({ name, slackUserId }: CoverCandidate) => ({ name, slackUserId });

  return {
    requester: { name: facilitator.name ?? '', slackUserId: slackUserIdFromProfileUrl(facilitator.slackProfileUrl) },
    courseTitle: course?.title ?? round?.title ?? '',
    unitNumber: unit?.unitNumber ?? (discussion.unitNumber !== null ? String(discussion.unitNumber) : null),
    groupName: group?.groupName ?? '',
    startTimeSeconds: discussion.startDateTime,
    endTimeSeconds: discussion.endDateTime,
    freeFacilitators: tagged.free.map(toPerson),
    noClashFacilitators: tagged.noClash.map(toPerson),
    moreFreeThanTagged,
    assignUrl: `${siteUrl}${ROUTES.facilitatedCourses.url}?${new URLSearchParams({ changeFacilitator: discussion.id })}`,
  };
}

export const facilitatorRouter = router({
  // --- Switching ---

  getFacilitatorsForRound: protectedProcedure.input(z.object({ roundId: z.string() })).query(async ({ input, ctx }) => {
    const { roundId } = input;
    const user = await getUserFromAuthOrThrow(ctx.auth);
    const currentFacilitator = await getFacilitator(roundId, user.id);

    const facilitators = await db.pg
      .select({ id: meetPersonTable.pg.id, name: meetPersonTable.pg.name })
      .from(meetPersonTable.pg)
      .where(and(eq(meetPersonTable.pg.round, roundId), eq(meetPersonTable.pg.role, COURSE_ROLE.FACILITATOR)));

    return facilitators
      .filter((f) => f.id !== currentFacilitator.id)
      .map((f) => ({ value: f.id, label: f.name ?? '' }));
  }),

  discussionsAvailable: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ input: { roundId }, ctx }) => {
      const user = await getUserFromAuthOrThrow(ctx.auth);
      const facilitator = await getFacilitator(roundId, user.id);

      const groupDiscussions = (await db.pg
        .select()
        .from(groupDiscussionTable.pg)
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        .where(and(inArray(groupDiscussionTable.pg.id, facilitator.expectedDiscussionsFacilitator || []))))
        .filter(hasEndDateTime);

      const groups = await db.pg
        .select()
        .from(groupTable.pg)
        .where(inArray(groupTable.pg.id, groupDiscussions.map((discussion) => discussion.group)));

      const unitIds = [...new Set(groupDiscussions.map((d) => d.courseBuilderUnitRecordId).filter(Boolean))] as string[];
      const units = unitIds.length > 0
        ? await db.scan(unitTable, { OR: unitIds.map((id) => ({ id, unitStatus: 'Active' as const })) })
        : [];

      const groupMap = new Map(groups.map((g) => [g.id, g]));
      const unitMap = new Map(units.map((u) => [u.id, u]));

      return groupDiscussions.map((discussion) => {
        const group = groupMap.get(discussion.group);
        if (!group) {
          throw new TRPCError({ code: 'NOT_FOUND', message: `Related group not found for discussion ${discussion.id}` });
        }

        return {
          ...discussion,
          groupDetails: group,
          unitRecord: unitMap.get(discussion.courseBuilderUnitRecordId ?? '') ?? null,
          isGroupFacilitator: isGroupFacilitator(group, facilitator.id),
        };
      });
    }),

  updateDiscussion: protectedProcedure
    .input(z.object({
      roundId: z.string(),
      discussionId: z.string().optional(),
      groupId: z.string(),
      requestedDateTimeInSeconds: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { roundId, discussionId, groupId, requestedDateTimeInSeconds } = input;

      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (requestedDateTimeInSeconds <= nowInSeconds) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Requested time must be in the future' });
      }

      const user = await getUserFromAuthOrThrow(ctx.auth);
      const facilitator = await getFacilitator(roundId, user.id);
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      const allowedDiscussions = facilitator.expectedDiscussionsFacilitator || [];

      if (allowedDiscussions.length === 0) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitator is not allowed to manage any discussions' });
      }

      if (discussionId) {
        if (!allowedDiscussions.includes(discussionId)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitator is not allowed to manage this discussion' });
        }

        const discussion = await db.getFirst(groupDiscussionTable, { filter: { id: discussionId } });
        if (!discussion || discussion.group !== groupId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Discussion does not belong to the specified group' });
        }
      }

      if (!discussionId) {
        const groupDiscussions = await db.pg
          .select({ id: groupDiscussionTable.pg.id })
          .from(groupDiscussionTable.pg)
          .where(and(eq(groupDiscussionTable.pg.group, groupId), inArray(groupDiscussionTable.pg.id, allowedDiscussions)));
        if (groupDiscussions.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitator is not allowed to manage any discussions in this group' });
        }

        const group = await db.getFirst(groupTable, { filter: { id: groupId } });
        if (!group || !isGroupFacilitator(group, facilitator.id)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Only the group\'s facilitator can change its discussion time permanently' });
        }
      }

      await db.insert(facilitatorDiscussionSwitchingTable, {
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        discussion: discussionId || null,
        facilitator: facilitator.id,
        group: groupId,
        status: 'Requested',
        switchType: discussionId ? 'Change for one unit' : 'Change permanently',
        facilitatorRequestedDatetime: requestedDateTimeInSeconds,
      });

      return null;
    }),

  requestFacilitatorChange: protectedProcedure
    .input(discussionInput.extend({ newFacilitatorId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const { discussionId, groupId, newFacilitatorId } = input;
      const { facilitator } = await getUpcomingDiscussionForFacilitator(input, ctx);

      const newFacilitator = await db.getFirst(meetPersonTable, { filter: { id: newFacilitatorId } });
      if (!newFacilitator) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'New facilitator not found' });
      }

      if (newFacilitator.round !== facilitator.round) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'New facilitator must be in the same round' });
      }

      if (newFacilitator.role !== COURSE_ROLE.FACILITATOR) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Selected person is not a facilitator' });
      }

      await db.insert(facilitatorDiscussionSwitchingTable, {
        discussion: discussionId,
        facilitator: newFacilitator.id,
        group: groupId,
        status: 'Requested',
        switchType: 'Update discussion facilitator',
        anythingElse: `Requested by facilitator ${facilitator.id}`,
      });

      return null;
    }),

  getCoverRequestPreview: protectedProcedure
    .input(discussionInput)
    .query(async ({ input, ctx }) => {
      const { facilitator, discussion } = await getCoverableDiscussion(input, ctx);
      const candidates = await getCoverCandidates({
        roundId: input.roundId,
        requesterId: facilitator.id,
        startTimeSeconds: discussion.startDateTime,
        endTimeSeconds: discussion.endDateTime,
      });
      const tagged = pickFacilitatorsToTag(candidates);

      return {
        messageDetails: await getCoverMessageDetails({
          facilitator, discussion, roundId: input.roundId, groupId: input.groupId, tagged, moreFreeThanTagged: candidates.free.length > MAX_TAGGED_FACILITATORS,
        }),
        taggedFacilitatorIds: [...tagged.free, ...tagged.noClash].map((f) => f.id),
      };
    }),

  requestCover: protectedProcedure
    .input(discussionInput.extend({
      note: z.string().max(1000).optional(),
      // The random pick shown in the preview, so the post matches it
      taggedFacilitatorIds: z.array(z.string()).max(MAX_TAGGED_FACILITATORS),
    }))
    .mutation(async ({ input, ctx }) => {
      const { facilitator, discussion } = await getCoverableDiscussion(input, ctx);
      const candidates = await getCoverCandidates({
        roundId: input.roundId,
        requesterId: facilitator.id,
        startTimeSeconds: discussion.startDateTime,
        endTimeSeconds: discussion.endDateTime,
      });
      const requested = new Set(input.taggedFacilitatorIds);
      const tagged = {
        free: candidates.free.filter((f) => requested.has(f.id)),
        noClash: candidates.noClash.filter((f) => requested.has(f.id)),
      };

      const messageDetails = await getCoverMessageDetails({
        facilitator, discussion, roundId: input.roundId, groupId: input.groupId, tagged, moreFreeThanTagged: candidates.free.length > MAX_TAGGED_FACILITATORS,
      });
      const { permalink } = await postToFacilitatorCommunity({ mrkdwn: toSlackMrkdwn(buildCoverMessage({ ...messageDetails, note: input.note })) });

      return { threadUrl: permalink };
    }),

  // --- Feedback ---

  getFeedbackFormData: protectedProcedure
    .input(z.object({ meetPersonId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitatorById(input.meetPersonId, ctx);
      const groups = await getGroupsForFacilitator(meetPerson);
      const groupIds = groups.map((g) => g.id);
      const participantIds = [...new Set(groups.flatMap((g) => g.participants ?? []))];
      const [dropInIds, followUpOptions] = await Promise.all([
        getDropInIdsForGroups(groupIds, participantIds),
        getNextStepsOptions(),
      ]);

      const round = meetPerson.round
        ? await db.getFirst(roundTable, { filter: { id: meetPerson.round }, sortBy: 'id' })
        : null;

      const facilitatorUser = meetPerson.userId
        ? await db.getFirst(userTable, { filter: { id: meetPerson.userId }, sortBy: 'id' })
        : null;
      if (!facilitatorUser) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Facilitator has no linked user' });
      }

      const existingCourseFeedback = (meetPerson.courseFeedback ?? []).length > 0
        ? await db.getFirst(courseFeedbackTable, { filter: { id: meetPerson.courseFeedback![0]! }, sortBy: 'id' })
        : null;

      const existingPeerFeedback = existingCourseFeedback
        ? await db.pg.select().from(peerFeedbackTable.pg)
          .where(arrayContains(peerFeedbackTable.pg.courseFeedback, [existingCourseFeedback.id]))
        : [];

      // Include peer feedback recipients in the name lookup so the UI can display manually-added
      // participants (who aren't in group.participants or drop-ins) after localStorage is cleared.
      const recipientIds = existingPeerFeedback.map((pf) => pf.feedbackRecipient?.[0] ?? '').filter(Boolean);
      const personIds = [...new Set([...participantIds, ...dropInIds, ...recipientIds])];
      const people = personIds.length > 0
        ? await db.pg
          .select({ id: meetPersonTable.pg.id, name: meetPersonTable.pg.name })
          .from(meetPersonTable.pg)
          .where(inArray(meetPersonTable.pg.id, personIds))
          .orderBy(asc(meetPersonTable.pg.name))
        : [];
      const nameById = new Map(people.map((p) => [p.id, p.name ?? '']));
      const dropInIdSet = new Set(dropInIds);

      return {
        meetPersonId: meetPerson.id,
        firstName: meetPerson.firstName,
        lastName: meetPerson.lastName,
        email: facilitatorUser.email,
        payForFacilitatedDiscussions: meetPerson.payForFacilitatedDiscussions,
        roundName: round?.title ?? '',
        roundStartDate: round?.startDate ?? null,
        roundLastDiscussionDate: round?.lastDiscussionDate ?? null,
        groupIds,
        followUpOptions,
        // Ordered by group (group 1's participants, then group 2's, ...) to help the facilitator
        // work through the form group by group.
        participants: participantIds.filter((id) => nameById.has(id)).map((id) => ({ id, name: nameById.get(id) ?? '' })),
        dropIns: people.filter((p) => dropInIdSet.has(p.id)).map((p) => ({ id: p.id, name: p.name ?? '' })),
        existingCourseFeedback: existingCourseFeedback ? {
          id: existingCourseFeedback.id,
          courseRating: existingCourseFeedback.courseRating,
          courseValue: existingCourseFeedback.courseValue,
          improvements: existingCourseFeedback.improvements,
          completed: existingCourseFeedback.completed,
        } : null,
        existingPeerFeedback: existingPeerFeedback.map((pf) => {
          const recipientId = pf.feedbackRecipient?.[0] ?? '';
          return {
            recipientId,
            recipientName: nameById.get(recipientId) ?? '',
            initiativeRating: pf.initiativeRating,
            reasoningQualityRating: pf.reasoningQualityRating,
            feedback: pf.feedback,
            nextSteps: pf.nextSteps,
          };
        }),
      };
    }),

  searchAddableParticipants: protectedProcedure
    .input(z.object({ meetPersonId: z.string().min(1), searchTerm: z.string().max(200).optional() }))
    .query(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitatorById(input.meetPersonId, ctx);
      const groups = await getGroupsForFacilitator(meetPerson);
      const participantIds = [...new Set(groups.flatMap((g) => g.participants ?? []))];
      const dropInIds = await getDropInIdsForGroups(groups.map((g) => g.id), participantIds);
      const excludeIds = [...participantIds, ...dropInIds];
      if (!meetPerson.round) return [];

      const trimmed = (input.searchTerm ?? '').trim();
      const conditions = [
        eq(meetPersonTable.pg.round, meetPerson.round),
        eq(meetPersonTable.pg.role, COURSE_ROLE.PARTICIPANT),
      ];
      if (excludeIds.length > 0) conditions.push(notInArray(meetPersonTable.pg.id, excludeIds));
      if (trimmed) conditions.push(ilike(meetPersonTable.pg.name, `%${trimmed}%`));

      const rows = await db.pg
        .select({ id: meetPersonTable.pg.id, name: meetPersonTable.pg.name })
        .from(meetPersonTable.pg)
        .where(and(...conditions))
        .orderBy(asc(meetPersonTable.pg.name))
        .limit(20);
      return rows.map((r) => ({ id: r.id, name: r.name ?? '' }));
    }),

  savePeerFeedback: protectedProcedure
    .input(z.object({
      meetPersonId: z.string().min(1),
      participantId: z.string().min(1),
      initiativeRating: z.number().min(1).max(5),
      reasoningQualityRating: z.number().min(1).max(5),
      feedback: z.string(),
      nextSteps: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitatorById(input.meetPersonId, ctx);
      const target = await db.getFirst(meetPersonTable, { filter: { id: input.participantId } });
      if (!target || target.role !== COURSE_ROLE.PARTICIPANT) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Participant is not in your round' });
      }

      if (target.round !== meetPerson.round) {
        const groups = await getGroupsForFacilitator(meetPerson);
        if (!groups.some((g) => g.round === target.round)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Participant is not in your round' });
        }
      }

      const validOptions = await getNextStepsOptions();
      const validNames = new Set(validOptions.map((o) => o.name));
      const invalid = input.nextSteps.filter((s) => !validNames.has(s));
      if (invalid.length > 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: `Unknown nextSteps option(s): ${invalid.join(', ')}` });
      }

      const courseFeedback = await getOrCreateCourseFeedback(meetPerson);

      const fields = {
        feedbackRecipient: [input.participantId],
        courseFeedback: [courseFeedback.id],
        initiativeRating: input.initiativeRating,
        reasoningQualityRating: input.reasoningQualityRating,
        feedback: input.feedback,
        nextSteps: input.nextSteps,
      };

      const [existing] = await db.pg.select({ id: peerFeedbackTable.pg.id }).from(peerFeedbackTable.pg)
        .where(and(
          arrayContains(peerFeedbackTable.pg.courseFeedback, [courseFeedback.id]),
          arrayContains(peerFeedbackTable.pg.feedbackRecipient, [input.participantId]),
        ));

      if (existing) {
        return db.update(peerFeedbackTable, { id: existing.id, ...fields });
      }

      return db.insert(peerFeedbackTable, fields);
    }),

  submitFeedback: protectedProcedure
    .input(z.object({
      meetPersonId: z.string().min(1),
      courseRating: z.number().min(1).max(5),
      courseValue: z.string(),
      improvements: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitatorById(input.meetPersonId, ctx);
      const courseFeedback = await getOrCreateCourseFeedback(meetPerson);

      await db.update(courseFeedbackTable, {
        id: courseFeedback.id,
        courseRating: input.courseRating,
        courseValue: input.courseValue,
        improvements: input.improvements,
        completed: true,
      });

      return { courseFeedbackId: courseFeedback.id };
    }),

  unsubmitFeedback: protectedProcedure
    .input(z.object({ meetPersonId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitatorById(input.meetPersonId, ctx);
      if (meetPerson.courseFeedback?.[0]) {
        await db.update(courseFeedbackTable, { id: meetPerson.courseFeedback[0], completed: null });
      }

      return { success: true };
    }),
});
