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

export const facilitatorFeedbackRouter = router({
  getFormData: protectedProcedure
    .input(z.object({
      meetPersonId: z.string().min(1),
    }))
    .query(async ({ input, ctx }) => {
      // 1. Find the facilitator's meetPerson record and verify ownership
      const meetPerson = await db.getFirst(meetPersonTable, {
        filter: { id: input.meetPersonId, email: ctx.auth.email },
      });
      if (!meetPerson || meetPerson.role !== 'Facilitator') {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Facilitator record not found' });
      }

      // 2. Find the group this person facilitates
      const groups = await db.pg
        .select({ id: groupTable.pg.id, groupName: groupTable.pg.groupName, participants: groupTable.pg.participants })
        .from(groupTable.pg)
        .where(arrayContains(groupTable.pg.facilitator, [meetPerson.id]));

      if (groups.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No group found for this facilitator' });
      }
      const group = groups[0]!;

      // 3. Get participant details
      const participantIds = group.participants ?? [];
      const participants = participantIds.length > 0
        ? await db.pg
          .select({ id: meetPersonTable.pg.id, name: meetPersonTable.pg.name })
          .from(meetPersonTable.pg)
          .where(inArray(meetPersonTable.pg.id, participantIds))
        : [];

      // 4. Get round name
      const round = meetPerson.round
        ? await db.getFirst(roundTable, { filter: { id: meetPerson.round }, sortBy: 'id' })
        : null;

      // 5. Get existing course feedback
      const existingCourseFeedback = (meetPerson.courseFeedback ?? []).length > 0
        ? await db.getFirst(courseFeedbackTable, {
          filter: { id: meetPerson.courseFeedback![0]! },
          sortBy: 'id',
        })
        : null;

      // 6. Get existing peer feedback for participants in this group
      const allPeerFeedback = await db.pg
        .select()
        .from(peerFeedbackTable.pg);
      const existingPeerFeedback = allPeerFeedback
        .filter((pf) => pf.feedbackRecipient?.some((r) => participantIds.includes(r)));

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
      // Verify the caller is the facilitator
      const meetPerson = await db.getFirst(meetPersonTable, {
        filter: { id: input.meetPersonId, email: ctx.auth.email },
      });
      if (!meetPerson || meetPerson.role !== 'Facilitator') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      if (input.peerFeedbackId) {
        return db.update(peerFeedbackTable, {
          id: input.peerFeedbackId,
          feedbackRecipient: [input.participantId],
          initiativeRating: input.initiativeRating,
          reasoningQualityRating: input.reasoningQualityRating,
          feedback: input.feedback,
          nextSteps: input.nextSteps,
        });
      }

      return db.insert(peerFeedbackTable, {
        feedbackRecipient: [input.participantId],
        initiativeRating: input.initiativeRating,
        reasoningQualityRating: input.reasoningQualityRating,
        feedback: input.feedback,
        nextSteps: input.nextSteps,
      });
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
      const meetPerson = await db.getFirst(meetPersonTable, {
        filter: { id: input.meetPersonId, email: ctx.auth.email },
      });
      if (!meetPerson || meetPerson.role !== 'Facilitator') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      // Get peer feedback IDs for linking
      const allPeerFeedback = await db.pg
        .select({ id: peerFeedbackTable.pg.id, feedbackRecipient: peerFeedbackTable.pg.feedbackRecipient })
        .from(peerFeedbackTable.pg);

      const groups = await db.pg
        .select({ participants: groupTable.pg.participants })
        .from(groupTable.pg)
        .where(arrayContains(groupTable.pg.facilitator, [meetPerson.id]));
      const participantIds = groups[0]?.participants ?? [];

      const peerFeedbackIds = allPeerFeedback
        .filter((pf) => pf.feedbackRecipient?.some((r) => participantIds.includes(r)))
        .map((pf) => pf.id);

      // Create or update course_feedback
      let courseFeedback;
      if (input.courseFeedbackId) {
        courseFeedback = await db.update(courseFeedbackTable, {
          id: input.courseFeedbackId,
          courseRating: input.courseRating,
          courseValue: input.courseValue,
          improvements: input.improvements,
          completed: true,
          personFeedback: peerFeedbackIds,
        });
      } else {
        courseFeedback = await db.insert(courseFeedbackTable, {
          person: [meetPerson.id],
          round: meetPerson.round ? [meetPerson.round] : [],
          courseRating: input.courseRating,
          courseValue: input.courseValue,
          improvements: input.improvements,
          completed: true,
          personFeedback: peerFeedbackIds,
        });
      }

      // Link course_feedback to meetPerson
      await db.update(meetPersonTable, {
        id: meetPerson.id,
        courseFeedback: [courseFeedback.id],
      });

      // Link peer feedback records back to course_feedback
      for (const pfId of peerFeedbackIds) {
        await db.update(peerFeedbackTable, {
          id: pfId,
          courseFeedback: [courseFeedback.id],
        });
      }

      return { courseFeedbackId: courseFeedback.id };
    }),

  unsubmit: protectedProcedure
    .input(z.object({
      meetPersonId: z.string().min(1),
    }))
    .mutation(async ({ input, ctx }) => {
      const meetPerson = await db.getFirst(meetPersonTable, {
        filter: { id: input.meetPersonId, email: ctx.auth.email },
      });
      if (!meetPerson || meetPerson.role !== 'Facilitator') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not authorized' });
      }

      // Clear courseFeedback link on meetPerson
      await db.update(meetPersonTable, {
        id: meetPerson.id,
        courseFeedback: [],
      });

      // Mark course_feedback as not completed
      if (meetPerson.courseFeedback?.[0]) {
        await db.update(courseFeedbackTable, {
          id: meetPerson.courseFeedback[0],
          completed: false,
        });
      }

      return { success: true };
    }),
});
