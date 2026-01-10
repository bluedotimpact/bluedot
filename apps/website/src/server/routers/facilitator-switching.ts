import {
  and,
  courseRegistrationTable,
  courseTable,
  eq,
  facilitatorDiscussionSwitchingTable,
  groupDiscussionTable,
  inArray,
  meetPersonTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

const getFacilitator = async (courseSlug: string, facilitatorEmail: string) => {
  const course = await db.getFirst(courseTable, {
    filter: { slug: courseSlug },
    sortBy: 'slug',
  });
  if (!course) {
    throw new TRPCError({ code: 'NOT_FOUND', message: `No course with slug ${courseSlug} found` });
  }

  const courseRegistration = await db.getFirst(courseRegistrationTable, {
    filter: {
      email: facilitatorEmail,
      courseId: course.id,
    },
  });
  if (!courseRegistration) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'No course registration found' });
  }

  const facilitator = await db.get(meetPersonTable, { applicationsBaseRecordId: courseRegistration.id });
  if (!facilitator) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'No facilitator found for this course registration' });
  }

  return facilitator;
};

export const facilitatorSwitchingRouter = router({
  getFacilitatorsForRound: protectedProcedure
    .input(z.object({ courseSlug: z.string() }))
    .query(async ({ input, ctx }) => {
      const { courseSlug } = input;

      const currentFacilitator = await getFacilitator(courseSlug, ctx.auth.email);
      if (!currentFacilitator.round) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Facilitator is not assigned to a round' });
      }

      // Get all meetPersons in the same round who are facilitators
      const facilitators = await db.pg
        .select({
          id: meetPersonTable.pg.id,
          name: meetPersonTable.pg.name,
        })
        .from(meetPersonTable.pg)
        .where(
          and(
            eq(meetPersonTable.pg.round, currentFacilitator.round),
            eq(meetPersonTable.pg.role, 'Facilitator'),
          ),
        );

      // Return as options for Select, excluding the current facilitator
      return facilitators
        .filter((f) => f.id !== currentFacilitator.id)
        .map((f) => ({
          value: f.id,
          label: f.name,
        }));
    }),

  updateDiscussion: protectedProcedure
    .input(
      z.object({
        courseSlug: z.string(),
        // When provided, we will update only a single discussion's date/time. Otherwise all future discussions are updated.
        discussionId: z.string().optional(),
        groupId: z.string(),
        requestedDateTimeInSeconds: z.number(), // Unix timestamp in seconds
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        courseSlug, discussionId, groupId, requestedDateTimeInSeconds,
      } = input;

      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (requestedDateTimeInSeconds <= nowInSeconds) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Requested time must be in the future' });
      }

      const facilitator = await getFacilitator(courseSlug, ctx.auth.email);
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
          .where(
            and(
              eq(groupDiscussionTable.pg.group, groupId),
              inArray(groupDiscussionTable.pg.id, allowedDiscussions),
            ),
          );

        if (groupDiscussions.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitator is not allowed to manage any discussions in this group' });
        }
      }

      await db.insert(facilitatorDiscussionSwitchingTable, {
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
    .input(
      z.object({
        courseSlug: z.string(),
        discussionId: z.string(),
        groupId: z.string(),
        newFacilitatorId: z.string(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const {
        courseSlug, discussionId, groupId, newFacilitatorId,
      } = input;

      const facilitator = await getFacilitator(courseSlug, ctx.auth.email);
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

      const newFacilitator = await db.get(meetPersonTable, { id: newFacilitatorId });
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
      });

      return null;
    }),
});
