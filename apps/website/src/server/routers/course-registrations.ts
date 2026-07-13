import {
  applicationsRoundTable, courseRegistrationTable, inArray,
  eq, and, or, ne, isNull, desc, sql, userTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { verifyPublicToken } from '../../lib/api/utils';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { ensureSelfServeRegistrationExistsProcedure } from './self-serve-course-registrations';

async function getCanonicalUserByEmail(email: string) {
  const users = await db.pg
    .select()
    .from(userTable.pg)
    .where(sql`lower(${userTable.pg.email}) = ${email.toLowerCase()}`)
    .orderBy(desc(userTable.pg.autoNumberId))
    .limit(1);
  return users[0] ?? null;
}

async function linkCourseRegistration(courseRegistrationId: string) {
  const courseRegistration = await db.getFirst(courseRegistrationTable, { filter: { id: courseRegistrationId } });
  if (!courseRegistration) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Course registration not found' });
  }

  if (courseRegistration.userId) {
    return { action: 'already-linked', userId: courseRegistration.userId } as const;
  }

  if (!courseRegistration.email) {
    return { action: 'skipped-no-email' } as const;
  }

  const existingUser = await getCanonicalUserByEmail(courseRegistration.email);
  if (existingUser) {
    await db.update(courseRegistrationTable, { id: courseRegistration.id, userId: existingUser.id });
    return { action: 'linked', userId: existingUser.id } as const;
  }

  const name = [courseRegistration.firstName, courseRegistration.lastName].filter(Boolean).join(' ').trim();
  const newUser = await db.insert(userTable, {
    email: courseRegistration.email.toLowerCase(),
    ...(name && { name }),
  });
  await db.update(courseRegistrationTable, { id: courseRegistration.id, userId: newUser.id });
  return { action: 'created-user-and-linked', userId: newUser.id } as const;
}

async function linkUserCourseRegistrations(userId: string) {
  const user = await db.getFirst(userTable, { filter: { id: userId } });
  if (!user) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
  }

  if (!user.email) {
    return { action: 'skipped-no-email' } as const;
  }

  const canonicalUser = (await getCanonicalUserByEmail(user.email)) ?? user;

  const unlinkedRegistrations = await db.pg
    .select()
    .from(courseRegistrationTable.pg)
    .where(and(
      sql`lower(${courseRegistrationTable.pg.email}) = ${user.email.toLowerCase()}`,
      or(isNull(courseRegistrationTable.pg.userId), eq(courseRegistrationTable.pg.userId, '')),
    ));

  await Promise.all(unlinkedRegistrations.map((registration) => db.update(courseRegistrationTable, {
    id: registration.id,
    userId: canonicalUser.id,
  })));

  return { action: 'linked-user-registrations', userId: canonicalUser.id, linkedCount: unlinkedRegistrations.length } as const;
}

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

  linkToUser: publicProcedure
    .input(z.object({
      publicToken: z.string().min(1),
      courseRegistrationId: z.string().optional(),
      userId: z.string().optional(),
    }).refine(
      (input) => (input.courseRegistrationId === undefined) !== (input.userId === undefined),
      { message: 'Provide exactly one of courseRegistrationId or userId' },
    ))
    .mutation(async ({ input }) => {
      verifyPublicToken(input.publicToken);

      if (input.courseRegistrationId !== undefined) {
        return linkCourseRegistration(input.courseRegistrationId);
      }

      return linkUserCourseRegistrations(input.userId!);
    }),

  // Self-serve registration now lives in selfServeCourseRegistrations.ensureExists; these two are
  // kept as backwards-compatible aliases for clients on the old routes. These can be deleted after ~2026-06-17
  ensureExists: ensureSelfServeRegistrationExistsProcedure,
  ensureSelfServeRegistrationExists: ensureSelfServeRegistrationExistsProcedure,
});
