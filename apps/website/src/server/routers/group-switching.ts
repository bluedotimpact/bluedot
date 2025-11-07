import {
  and,
  arrayContains,
  courseRegistrationTable,
  courseTable,
  groupDiscussionTable,
  groupSwitchingTable,
  groupTable,
  inArray,
  meetPersonTable,
  roundTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const groupSwitchingRouter = router({
  switchGroup: protectedProcedure
    .input(
      z.object({
        switchType: z.enum(['Switch group for one unit', 'Switch group permanently']),
        notesFromParticipant: z.string().min(1),
        oldGroupId: z.string().optional(),
        newGroupId: z.string().optional(),
        oldDiscussionId: z.string().optional(),
        newDiscussionId: z.string().optional(),
        isManualRequest: z.boolean(),
        courseSlug: z.string(),
      }),
    )
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
            .where(
              and(
                arrayContains(groupDiscussionTable.pg.facilitators, [participantId]),
                inArray(
                  groupDiscussionTable.pg.group,
                  [inputOldGroupId, inputNewGroupId].filter((v): v is string => v !== null),
                ),
              ),
            ),
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
    }),
});
