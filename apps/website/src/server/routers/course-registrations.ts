import {
  applicationsRoundTable, courseRegistrationTable, inArray,
  eq, and, or, ne, isNull,
} from '@bluedot/db';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { ensureSelfServeRegistrationExistsProcedure } from './self-serve-course-registrations';

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

  // Self-serve registration now lives in selfServeCourseRegistrations.ensureExists; these two are
  // kept as backwards-compatible aliases for clients on the old routes. These can be deleted after ~2026-06-17
  ensureExists: ensureSelfServeRegistrationExistsProcedure,
  ensureSelfServeRegistrationExists: ensureSelfServeRegistrationExistsProcedure,
});
