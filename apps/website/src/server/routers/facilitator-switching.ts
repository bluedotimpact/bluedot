import {
  and,
  courseRegistrationTable,
  courseTable,
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
import { calculateGroupAvailability } from './group-switching';

export const facilitatorSwitchingRouter = router({
  discussionsAvailable: protectedProcedure
    .input(
      z.object({
        courseSlug: z.string(),
      }),
    )
    .query(async ({ input: { courseSlug }, ctx }) => {
      const course = await db.get(courseTable, { slug: courseSlug });
      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `No course with slug ${courseSlug} found` });
      }

      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
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

      return {
        discussionsAvailable,
        groupsAvailable,
      };
    }),
      const units = await Promise.all(
        groupDiscussions.map(async (discussion) => {
          if (!discussion.courseBuilderUnitRecordId) {
            return null;
          }
          const unit = await db.getFirst(unitTable, { filter: { id: discussion.courseBuilderUnitRecordId, courseSlug, unitStatus: 'Active' } });
          return unit;
        }),
      );


});
