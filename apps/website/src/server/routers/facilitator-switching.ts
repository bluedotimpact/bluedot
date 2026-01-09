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

      // Ensure the facilitator is allowed to manage the specified discussion
      if (discussionId) {
        if (allowedDiscussions.length === 0 || !allowedDiscussions.includes(discussionId)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitator is not allowed to manage this discussion' });
        }
        const discussion = await db.getFirst(groupDiscussionTable, { filter: { id: discussionId } });
        if (!discussion || discussion.group !== groupId) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Discussion does not belong to the specified group' });
        }
      }

      // If no discussionId is provided, ensure the facilitator is allowed to manage at least one discussion for the group
      if (!discussionId) {
        if (allowedDiscussions.length === 0) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Facilitator is not allowed to manage any discussions' });
        }

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
});
