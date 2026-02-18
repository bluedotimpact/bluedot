import {
  and,
  eq,
  facilitatorDiscussionSwitchingTable,
  groupDiscussionTable,
  groupTable,
  inArray,
  meetPersonTable,
  unitTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

const getFacilitator = async (roundId: string, facilitatorEmail: string) => {
  const facilitator = await db.getFirst(meetPersonTable, {
    filter: { round: roundId, email: facilitatorEmail, role: 'Facilitator' },
  });
  if (!facilitator) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'No facilitator found for this round' });
  }

  return facilitator;
};

export const facilitatorSwitchingRouter = router({
  getFacilitatorsForRound: protectedProcedure.input(z.object({ roundId: z.string() })).query(async ({ input, ctx }) => {
    const { roundId } = input;

    const currentFacilitator = await getFacilitator(roundId, ctx.auth.email);

    // Get all meetPersons in the same round who are facilitators
    const facilitators = await db.pg
      .select({
        id: meetPersonTable.pg.id,
        name: meetPersonTable.pg.name,
      })
      .from(meetPersonTable.pg)
      .where(and(eq(meetPersonTable.pg.round, roundId), eq(meetPersonTable.pg.role, 'Facilitator')));

    // Return as options for Select, excluding the current facilitator
    return facilitators
      .filter((f) => f.id !== currentFacilitator.id)
      .map((f) => ({
        value: f.id,
        label: f.name,
      }));
  }),

  discussionsAvailable: protectedProcedure
    .input(z.object({
      roundId: z.string(),
    }))
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
        .where(inArray(
          groupTable.pg.id,
          groupDiscussions.map((discussion) => discussion.group),
        ));

      const unitIds = [
        ...new Set(groupDiscussions.map((d) => d.courseBuilderUnitRecordId).filter(Boolean)),
      ] as string[];
      const units
        = unitIds.length > 0
          ? await db.scan(unitTable, {
            OR: unitIds.map((id) => ({ id, unitStatus: 'Active' as const })),
          })
          : [];

      const groupMap = new Map(groups.map((g) => [g.id, g]));
      const unitMap = new Map(units.map((u) => [u.id, u]));

      // Return enriched discussions in the same shape as GroupDiscussionWithGroupAndUnit
      const enrichedDiscussions = groupDiscussions.map((discussion) => {
        const group = groupMap.get(discussion.group);
        if (!group) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Related group not found for discussion ${discussion.id}`,
          });
        }

        return {
          ...discussion,
          groupDetails: group,
          unitRecord: unitMap.get(discussion.courseBuilderUnitRecordId ?? '') ?? null,
        };
      });

      return enrichedDiscussions;
    }),

  updateDiscussion: protectedProcedure
    .input(z.object({
      roundId: z.string(),
      // When provided, we will update only a single discussion's date/time. Otherwise all future discussions are updated.
      discussionId: z.string().optional(),
      groupId: z.string(),
      requestedDateTimeInSeconds: z.number(), // Unix timestamp in seconds
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

      // Ensure the facilitator is allowed to manage the specified discussion
      if (discussionId) {
        if (!allowedDiscussions.includes(discussionId)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitator is not allowed to manage this discussion' });
        }

        const discussion = await db.getFirst(groupDiscussionTable, { filter: { id: discussionId } });
        if (!discussion || discussion.group !== groupId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Discussion does not belong to the specified group' });
        }
      }

      // If no discussionId is provided, ensure the facilitator is allowed to manage at least one discussion for the group
      if (!discussionId) {
        const groupDiscussions = await db.pg
          .select({ id: groupDiscussionTable.pg.id })
          .from(groupDiscussionTable.pg)
          .where(and(eq(groupDiscussionTable.pg.group, groupId), inArray(groupDiscussionTable.pg.id, allowedDiscussions)));

        if (groupDiscussions.length === 0) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Facilitator is not allowed to manage any discussions in this group',
          });
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
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot change facilitator for a discussion that has already started',
        });
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
});
