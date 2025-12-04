import {
  and,
  courseRegistrationTable,
  courseTable,
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

const getFacilitator = async (courseSlug: string, facilitatorEmail: string) => {
  const course = await db.get(courseTable, { slug: courseSlug });
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
  discussionsAvailable: protectedProcedure
    .input(
      z.object({
        courseSlug: z.string(),
      }),
    )
    .query(async ({ input: { courseSlug }, ctx }) => {
      const facilitator = await getFacilitator(courseSlug, ctx.auth.email);

      const groupDiscussions = await db.pg
        .select()
        .from(groupDiscussionTable.pg)
        .where(
          and(
            inArray(groupDiscussionTable.pg.id, facilitator.expectedDiscussionsFacilitator || []),
            // TODO: if `startDateTime` is in GMT, will there be problems with timezone?
            // gte(groupDiscussionTable.pg.startDateTime, Date.now()),
          ),
        );
      // TODO: only fetch what columns we need?
      const groups = await db.pg.select().from(groupTable.pg).where(
        inArray(groupTable.pg.id, groupDiscussions.map((discussion) => discussion.group)),
      );

      const units = await Promise.all(
        groupDiscussions.map(async (discussion) => {
          if (!discussion.courseBuilderUnitRecordId) {
            return null;
          }
          const unit = await db.getFirst(unitTable, { filter: { id: discussion.courseBuilderUnitRecordId, courseSlug, unitStatus: 'Active' } });
          return unit;
        }),
      );

      const discussionsByGroup: Record<string, { id: string, startDateTime: number, endDateTime: number, label: string, hasStarted: boolean }[]> = {};
      for (const discussion of groupDiscussions) {
        if (!discussionsByGroup[discussion.group]) {
          discussionsByGroup[discussion.group] = [];
        }
        const unit = units.find((u) => u && u.id === discussion.courseBuilderUnitRecordId);

        discussionsByGroup[discussion.group]?.push({
          id: discussion.id,
          startDateTime: discussion.startDateTime,
          endDateTime: discussion.endDateTime,
          label: unit ? `Unit ${unit.unitNumber}: ${unit.title}` : 'Unknown Unit',
          hasStarted: discussion.startDateTime * 1000 <= Date.now(),
        });
      }

      // Sort discussions within each group by startDateTime (earliest first)
      for (const discussions of Object.values(discussionsByGroup)) {
        discussions.sort((a, b) => a.startDateTime - b.startDateTime);
      }

      return { groups, discussionsByGroup };
    }),

  updateDiscussion: protectedProcedure
    .input(
      z.object({
        courseSlug: z.string(),
        // When provided, we will update only a single discussion's date/time. Otherwise all future discussions are updated.
        discussionId: z.string().optional(),
        groupId: z.string(),
        newDateTime: z.number(), // Unix timestamp in milliseconds
      }),
    )
    .mutation(async ({ input, ctx }) => {
      const { courseSlug, discussionId, groupId, newDateTime } = input;

      const facilitator = await getFacilitator(courseSlug, ctx.auth.email);

      await db.insert(facilitatorDiscussionSwitchingTable, {
        discussion: discussionId || null,
        facilitator: facilitator.id,
        group: groupId,
        status: 'Requested',
        switchType: discussionId ? 'Change for one unit' : 'Change permanently',
        updatedDatetime: newDateTime,
      });

      return null;
    }),
});
