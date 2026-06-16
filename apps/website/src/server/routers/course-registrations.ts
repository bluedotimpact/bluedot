import {
  applicationsCourseTable, applicationsRoundTable, courseRegistrationTable, inArray,
  eq, and, or, ne, isNull, selfServeCourseRegistrationTable, userTable,
} from '@bluedot/db';
import z from 'zod';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { FOAI_COURSE_ID } from '../../lib/constants';

export const courseRegistrationsRouter = router({
  getByCourseId: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;
      return db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          courseId,
          decision: 'Accept',
        },
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return db.pg.select()
      .from(courseRegistrationTable.pg)
      .where(and(
        eq(courseRegistrationTable.pg.email, ctx.auth.email),
        or(
          ne(courseRegistrationTable.pg.decision, 'Withdrawn'),
          isNull(courseRegistrationTable.pg.decision),
        ),
      ));
  }),

  getRoundStartDates: protectedProcedure
    .input(z.object({ roundIds: z.array(z.string()) }))
    .query(async ({ input }) => {
      if (!input.roundIds.length) {
        return {} as Record<string, string | null>;
      }

      const rounds = await db.pg.select({
        id: applicationsRoundTable.pg.id,
        firstDiscussionDate: applicationsRoundTable.pg.firstDiscussionDate,
      })
        .from(applicationsRoundTable.pg)
        .where(inArray(applicationsRoundTable.pg.id, input.roundIds));
      return Object.fromEntries(rounds.map((r) => [r.id, r.firstDiscussionDate])) as Record<string, string | null>;
    }),

  ensureSelfServeRegistrationExists: protectedProcedure
    .input(z.object({ courseId: z.string(), source: z.string().trim().max(255).optional() }))
    .mutation(async ({ ctx, input }) => {
      const { courseId, source } = input;

      if (courseId !== FOAI_COURSE_ID) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only the Future of AI course supports self-serve registration' });
      }

      const existingRegistration = await db.getFirst(selfServeCourseRegistrationTable, {
        filter: { email: ctx.auth.email, courseId },
        sortBy: 'createdAt',
      });

      if (existingRegistration) {
        return existingRegistration;
      }

      const applicationsCourse = await db.getFirst(applicationsCourseTable, {
        sortBy: 'id',
        filter: { courseBuilderId: courseId },
      });
      if (!applicationsCourse) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Course configuration not found for course: ${courseId}` });
      }

      const user = await db.getFirst(userTable, { filter: { email: ctx.auth.email } });
      return db.insert(selfServeCourseRegistrationTable, {
        userId: user?.id ?? null,
        courseApplicationsBaseId: applicationsCourse.id,
        source: source ?? null,
        createdAt: new Date().toISOString(),
      });
    }),
});
