import {
  and,
  arrayContains,
  asc,
  courseFeedbackTable,
  eq,
  facilitatorDiscussionSwitchingTable,
  groupDiscussionTable,
  groupTable,
  ilike,
  inArray,
  meetPersonTable,
  notInArray,
  peerFeedbackTable,
  roundTable,
  unitTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { checkAdminAccess, protectedProcedure, router } from '../trpc';
import { getFieldOptions, type FieldOption } from '../airtableSchema';
import { ACTIONABLE_FOLLOW_UP_IDS } from '../../lib/facilitatorFollowUps';

const PEER_FEEDBACK_BASE_ID = 'appPs3sb9BrYZN69z';
const PEER_FEEDBACK_TABLE_ID = 'tbl8KC4Q1i5YlCGhm';
const PEER_FEEDBACK_NEXT_STEPS_FIELD_ID = 'fldDXBWnFLi7vD2CQ';

const getNextStepsOptions = () => getFieldOptions(PEER_FEEDBACK_BASE_ID, PEER_FEEDBACK_TABLE_ID, PEER_FEEDBACK_NEXT_STEPS_FIELD_ID);

const checkActionableFollowUps = async (options: FieldOption[]) => {
  const names = new Set(options.map((o) => o.name));
  const missing = ACTIONABLE_FOLLOW_UP_IDS.filter((id) => !names.has(id));
  if (missing.length === 0) return;

  const message = `[facilitator-feedback] ACTIONABLE_FOLLOW_UP_IDS no longer match Airtable nextSteps options. Missing: ${missing.join(', ')}. Update apps/website/src/lib/facilitatorFollowUps.ts.`;
  if (process.env.NODE_ENV !== 'production') {
    throw new Error(message);
  }
  await slackAlert(env, [message]);
};

const getFacilitator = async (roundId: string, facilitatorEmail: string) => {
  const facilitator = await db.getFirst(meetPersonTable, {
    filter: { round: roundId, email: facilitatorEmail, role: 'Facilitator' },
  });
  if (!facilitator) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'No facilitator found for this round' });
  }

  return facilitator;
};

async function verifyFacilitatorById(meetPersonId: string, ctx: { auth: { email: string }; impersonation?: { adminEmail: string } | null }) {
  const meetPerson = await db.getFirst(meetPersonTable, {
    filter: { id: meetPersonId },
  });
  if (!meetPerson || meetPerson.role !== 'Facilitator') {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Not found' });
  }

  if (meetPerson.email !== ctx.auth.email) {
    // During impersonation, check the real admin's permissions, not the impersonated user's.
    const realEmail = ctx.impersonation?.adminEmail ?? ctx.auth.email;
    const isAdmin = await checkAdminAccess(realEmail);
    if (!isAdmin) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Not found' });
    }
  }

  return meetPerson;
}

async function getGroupForFacilitator(facilitatorId: string) {
  const groups = await db.pg
    .select({ id: groupTable.pg.id, groupName: groupTable.pg.groupName, participants: groupTable.pg.participants })
    .from(groupTable.pg)
    .where(arrayContains(groupTable.pg.facilitator, [facilitatorId]));
  if (groups.length === 0) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'No group found for this facilitator' });
  }

  return groups[0]!;
}

async function getDropInIdsForGroup(groupId: string, participantIds: string[]) {
  const discussions = await db.pg
    .select({ attendees: groupDiscussionTable.pg.attendees })
    .from(groupDiscussionTable.pg)
    .where(eq(groupDiscussionTable.pg.group, groupId));
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
    .where(and(inArray(meetPersonTable.pg.id, candidates), eq(meetPersonTable.pg.role, 'Participant')));
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

export const facilitatorRouter = router({
  // --- Switching ---

  getFacilitatorsForRound: protectedProcedure.input(z.object({ roundId: z.string() })).query(async ({ input, ctx }) => {
    const { roundId } = input;
    const currentFacilitator = await getFacilitator(roundId, ctx.auth.email);

    const facilitators = await db.pg
      .select({ id: meetPersonTable.pg.id, name: meetPersonTable.pg.name })
      .from(meetPersonTable.pg)
      .where(and(eq(meetPersonTable.pg.round, roundId), eq(meetPersonTable.pg.role, 'Facilitator')));

    return facilitators
      .filter((f) => f.id !== currentFacilitator.id)
      .map((f) => ({ value: f.id, label: f.name ?? '' }));
  }),

  discussionsAvailable: protectedProcedure
    .input(z.object({ roundId: z.string() }))
    .query(async ({ input: { roundId }, ctx }) => {
      const facilitator = await getFacilitator(roundId, ctx.auth.email);

      const groupDiscussions = await db.pg
        .select()
        .from(groupDiscussionTable.pg)
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        .where(and(inArray(groupDiscussionTable.pg.id, facilitator.expectedDiscussionsFacilitator || [])));

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

        return { ...discussion, groupDetails: group, unitRecord: unitMap.get(discussion.courseBuilderUnitRecordId ?? '') ?? null };
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

      const facilitator = await getFacilitator(roundId, ctx.auth.email);
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
    .input(z.object({
      roundId: z.string(),
      discussionId: z.string(),
      groupId: z.string(),
      newFacilitatorId: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const { roundId, discussionId, groupId, newFacilitatorId } = input;

      const facilitator = await getFacilitator(roundId, ctx.auth.email);
      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      const allowedDiscussions = facilitator.expectedDiscussionsFacilitator || [];

      if (allowedDiscussions.length === 0 || !allowedDiscussions.includes(discussionId)) {
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

      const newFacilitator = await db.getFirst(meetPersonTable, { filter: { id: newFacilitatorId } });
      if (!newFacilitator) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'New facilitator not found' });
      }

      if (newFacilitator.round !== facilitator.round) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'New facilitator must be in the same round' });
      }

      if (newFacilitator.role !== 'Facilitator') {
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

  // --- Feedback ---

  getFeedbackFormData: protectedProcedure
    .input(z.object({ meetPersonId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitatorById(input.meetPersonId, ctx);
      const group = await getGroupForFacilitator(meetPerson.id);
      const participantIds = group.participants ?? [];
      const [dropInIds, followUpOptions] = await Promise.all([
        getDropInIdsForGroup(group.id, participantIds),
        getNextStepsOptions(),
      ]);
      await checkActionableFollowUps(followUpOptions);

      const round = meetPerson.round
        ? await db.getFirst(roundTable, { filter: { id: meetPerson.round }, sortBy: 'id' })
        : null;

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
      const participantIdSet = new Set(participantIds);
      const dropInIdSet = new Set(dropInIds);

      return {
        meetPersonId: meetPerson.id,
        firstName: meetPerson.firstName,
        lastName: meetPerson.lastName,
        email: meetPerson.email,
        payForFacilitatedDiscussions: meetPerson.payForFacilitatedDiscussions,
        roundName: round?.title ?? '',
        roundStartDate: round?.startDate ?? null,
        roundLastDiscussionDate: round?.lastDiscussionDate ?? null,
        groupId: group.id,
        groupName: group.groupName,
        followUpOptions,
        participants: people.filter((p) => participantIdSet.has(p.id)).map((p) => ({ id: p.id, name: p.name ?? '' })),
        dropIns: people.filter((p) => dropInIdSet.has(p.id)).map((p) => ({ id: p.id, name: p.name ?? '' })),
        existingCourseFeedback: existingCourseFeedback ? {
          id: existingCourseFeedback.id,
          courseRating: existingCourseFeedback.courseRating,
          courseValue: existingCourseFeedback.courseValue,
          improvements: existingCourseFeedback.improvements,
          submittedAt: existingCourseFeedback.submittedAt,
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
      const group = await getGroupForFacilitator(meetPerson.id);
      const participantIds = group.participants ?? [];
      const dropInIds = await getDropInIdsForGroup(group.id, participantIds);
      const excludeIds = [...participantIds, ...dropInIds];
      if (!meetPerson.round) return [];

      const trimmed = (input.searchTerm ?? '').trim();
      const conditions = [
        eq(meetPersonTable.pg.round, meetPerson.round),
        eq(meetPersonTable.pg.role, 'Participant'),
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
      if (!target || target.role !== 'Participant' || target.round !== meetPerson.round) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Participant is not in your round' });
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
        submittedAt: Math.floor(Date.now() / 1000),
      });

      return { courseFeedbackId: courseFeedback.id };
    }),

  unsubmitFeedback: protectedProcedure
    .input(z.object({ meetPersonId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitatorById(input.meetPersonId, ctx);
      if (meetPerson.courseFeedback?.[0]) {
        await db.update(courseFeedbackTable, { id: meetPerson.courseFeedback[0], submittedAt: null });
      }

      return { success: true };
    }),
});
