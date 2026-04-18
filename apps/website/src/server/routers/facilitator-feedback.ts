import {
  arrayContains,
  courseFeedbackTable,
  groupTable,
  inArray,
  meetPersonTable,
  peerFeedbackTable,
  roundTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

async function verifyFacilitator(meetPersonId: string, email: string) {
  const meetPerson = await db.getFirst(meetPersonTable, {
    filter: { id: meetPersonId, email },
  });
  if (!meetPerson || meetPerson.role !== 'Facilitator') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
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

async function getPeerFeedbackForParticipants(participantIds: string[]) {
  if (participantIds.length === 0) return [];
  const all = await db.pg.select().from(peerFeedbackTable.pg);
  return all.filter((pf) => pf.feedbackRecipient?.some((r) => participantIds.includes(r)));
}

export const facilitatorFeedbackRouter = router({
  getFormData: protectedProcedure
    .input(z.object({ meetPersonId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitator(input.meetPersonId, ctx.auth.email);
      const group = await getGroupForFacilitator(meetPerson.id);
      const participantIds = group.participants ?? [];

      const [participants, round, existingCourseFeedback, existingPeerFeedback] = await Promise.all([
        participantIds.length > 0
          ? db.pg.select({ id: meetPersonTable.pg.id, name: meetPersonTable.pg.name }).from(meetPersonTable.pg).where(inArray(meetPersonTable.pg.id, participantIds))
          : [],
        meetPerson.round
          ? db.getFirst(roundTable, { filter: { id: meetPerson.round }, sortBy: 'id' })
          : null,
        (meetPerson.courseFeedback ?? []).length > 0
          ? db.getFirst(courseFeedbackTable, { filter: { id: meetPerson.courseFeedback![0]! }, sortBy: 'id' })
          : null,
        getPeerFeedbackForParticipants(participantIds),
      ]);

      return {
        meetPersonId: meetPerson.id,
        roundName: round?.title ?? '',
        groupId: group.id,
        groupName: group.groupName,
        participants: participants.map((p) => ({ id: p.id, name: p.name ?? '' })),
        existingCourseFeedback: existingCourseFeedback ? {
          id: existingCourseFeedback.id,
          courseRating: existingCourseFeedback.courseRating,
          courseValue: existingCourseFeedback.courseValue,
          improvements: existingCourseFeedback.improvements,
          completed: existingCourseFeedback.completed,
        } : null,
        existingPeerFeedback: existingPeerFeedback.map((pf) => ({
          id: pf.id,
          recipientId: pf.feedbackRecipient?.[0] ?? '',
          initiativeRating: pf.initiativeRating,
          reasoningQualityRating: pf.reasoningQualityRating,
          feedback: pf.feedback,
          nextSteps: pf.nextSteps,
        })),
      };
    }),

  savePeerFeedback: protectedProcedure
    .input(z.object({
      meetPersonId: z.string().min(1),
      participantId: z.string().min(1),
      peerFeedbackId: z.string().optional(),
      initiativeRating: z.number().min(1).max(5),
      reasoningQualityRating: z.number().min(1).max(5),
      feedback: z.string(),
      nextSteps: z.array(z.string()),
    }))
    .mutation(async ({ input, ctx }) => {
      await verifyFacilitator(input.meetPersonId, ctx.auth.email);

      const fields = {
        feedbackRecipient: [input.participantId],
        initiativeRating: input.initiativeRating,
        reasoningQualityRating: input.reasoningQualityRating,
        feedback: input.feedback,
        nextSteps: input.nextSteps,
      };

      if (input.peerFeedbackId) {
        return db.update(peerFeedbackTable, { id: input.peerFeedbackId, ...fields });
      }
      return db.insert(peerFeedbackTable, fields);
    }),

  submit: protectedProcedure
    .input(z.object({
      meetPersonId: z.string().min(1),
      courseRating: z.number().min(1).max(5),
      courseValue: z.string(),
      improvements: z.string(),
      courseFeedbackId: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitator(input.meetPersonId, ctx.auth.email);
      const group = await getGroupForFacilitator(meetPerson.id);
      const peerFeedback = await getPeerFeedbackForParticipants(group.participants ?? []);
      const peerFeedbackIds = peerFeedback.map((pf) => pf.id);

      const courseFields = {
        courseRating: input.courseRating,
        courseValue: input.courseValue,
        improvements: input.improvements,
        completed: true as const,
        personFeedback: peerFeedbackIds,
      };

      const courseFeedback = input.courseFeedbackId
        ? await db.update(courseFeedbackTable, { id: input.courseFeedbackId, ...courseFields })
        : await db.insert(courseFeedbackTable, {
          person: [meetPerson.id],
          round: meetPerson.round ? [meetPerson.round] : [],
          ...courseFields,
        });

      await db.update(meetPersonTable, { id: meetPerson.id, courseFeedback: [courseFeedback.id] });

      for (const pfId of peerFeedbackIds) {
        await db.update(peerFeedbackTable, { id: pfId, courseFeedback: [courseFeedback.id] });
      }

      return { courseFeedbackId: courseFeedback.id };
    }),

  unsubmit: protectedProcedure
    .input(z.object({ meetPersonId: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const meetPerson = await verifyFacilitator(input.meetPersonId, ctx.auth.email);
      await db.update(meetPersonTable, { id: meetPerson.id, courseFeedback: [] });
      if (meetPerson.courseFeedback?.[0]) {
        await db.update(courseFeedbackTable, { id: meetPerson.courseFeedback[0], completed: false });
      }
      return { success: true };
    }),
});
