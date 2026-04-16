import {
  and,
  courseRegistrationTable,
  courseTable,
  dropoutTable,
  eq,
  meetPersonTable,
  notExists,
  sql,
} from '@bluedot/db';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const meetPersonRouter = router({
  getByCourseRegistrationId: protectedProcedure
    .input(z.object({ courseRegistrationId: z.string() }))
    .query(async ({ input: { courseRegistrationId }, ctx }) => {
      return db.getFirst(meetPersonTable, {
        filter: {
          applicationsBaseRecordId: courseRegistrationId,
          email: ctx.auth.email,
        },
      });
    }),

  getInactiveCourseRegistrations: protectedProcedure
    .input(z.object({ courseSlug: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      const results = await db.pg
        .select({
          courseRegistrationId: courseRegistrationTable.pg.id,
          courseSlug: courseTable.pg.slug,
          roundId: meetPersonTable.pg.round,
        })
        .from(courseRegistrationTable.pg)
        .innerJoin(meetPersonTable.pg, eq(meetPersonTable.pg.applicationsBaseRecordId, courseRegistrationTable.pg.id))
        .innerJoin(courseTable.pg, eq(courseTable.pg.id, courseRegistrationTable.pg.courseId))
        .where(and(
          eq(courseRegistrationTable.pg.email, ctx.auth.email),
          eq(courseRegistrationTable.pg.decision, 'Accept'),
          eq(courseRegistrationTable.pg.roundStatus, 'Active'),
          // Exclude users who have dropped out or deferred
          notExists(db.pg
            .select({ one: sql`1` })
            .from(dropoutTable.pg)
            .where(sql`${courseRegistrationTable.pg.id} = ANY(${dropoutTable.pg.applicantId})`)),
          eq(meetPersonTable.pg.hasSentInactiveEmail, true),
          // Exclude users who have rejoined a group (field is empty while inactive)
          sql`coalesce(cardinality(${meetPersonTable.pg.groupsAsParticipant}), 0) = 0`,
          // Optionally filter by course slug if provided
          ...(input.courseSlug ? [eq(courseTable.pg.slug, input.courseSlug)] : []),
        ));
      return results;
    }),
});
