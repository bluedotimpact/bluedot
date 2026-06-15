import {
  applicationsCourseTable, applicationsRoundTable, COURSE_ROLE, courseRegistrationTable, inArray,
  eq, and, or, ne, isNull, selfServeCourseRegistrationTable, userTable,
} from '@bluedot/db';
import z from 'zod';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { FOAI_COURSE_ID } from '../../lib/constants';

const ensureSelfServeRegistrationExistsProcedure = protectedProcedure
  .input(z.object({ courseId: z.string(), source: z.string().trim().max(255).optional() }))
  .mutation(async ({ ctx, input }) => {
    const { courseId, source } = input;

    // In-progress migration to self-serve table (#2526): Prefer the self-serve table, fall back to legacy
    const selfServeRegistration = await db.getFirst(selfServeCourseRegistrationTable, {
      filter: { email: ctx.auth.email, courseId },
      sortBy: 'createdAt',
    });
    const legacyRegistration = await db.getFirst(courseRegistrationTable, {
      filter: {
        email: ctx.auth.email,
        courseId,
        decision: 'Accept',
      },
    });
    const existingRegistration = selfServeRegistration ?? legacyRegistration;

    // If the course registration already exists, return it
    if (existingRegistration) {
      return existingRegistration;
    }

    if (courseId === FOAI_COURSE_ID) {
      const applicationsCourse = await db.getFirst(applicationsCourseTable, {
        sortBy: 'id',
        filter: { courseBuilderId: courseId },
      });

      if (!applicationsCourse) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Course configuration not found for course: ${courseId}` });
      }

      // Legacy first: if the second insert fails, the orphan is a missing self-serve row (harmless
      // while reads still hit legacy, and healed by the backfill) rather than a missing legacy row.
      await db.insert(courseRegistrationTable, {
        email: ctx.auth.email,
        courseApplicationsBaseId: applicationsCourse.id,
        role: COURSE_ROLE.PARTICIPANT,
        decision: 'Accept',
        source: source ?? null,
      });

      const user = await db.getFirst(userTable, { filter: { email: ctx.auth.email } });
      return db.insert(selfServeCourseRegistrationTable, {
        userId: user?.id ?? null,
        courseApplicationsBaseId: applicationsCourse.id,
        source: source ?? null,
        createdAt: new Date().toISOString(),
      });
    }

    return null;
  });

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
  ensureExists: ensureSelfServeRegistrationExistsProcedure,
  ensureSelfServeRegistrationExists: ensureSelfServeRegistrationExistsProcedure,
});
