import {
  applicationsRoundTable, courseRegistrationTable, inArray,
  eq, and, or, ne, isNull, sql, userTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { normaliseEmail, verifyPublicToken } from '../../lib/api/utils';
import {
  getUserFromAuthOrThrow, protectedProcedure, publicProcedure, router,
} from '../trpc';
import { ensureSelfServeRegistrationExistsProcedure } from './self-serve-course-registrations';

export const courseRegistrationsRouter = router({
  getByCourseId: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;
      const user = await getUserFromAuthOrThrow(ctx.auth);

      return db.getFirst(courseRegistrationTable, {
        filter: {
          userId: user.id,
          courseId,
          decision: 'Accept',
        },
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    const user = await getUserFromAuthOrThrow(ctx.auth);

    return db.pg.select()
      .from(courseRegistrationTable.pg)
      .where(and(
        eq(courseRegistrationTable.pg.userId, user.id),
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

      // 1. Link-or-create the user if we are given a course registration
      if (input.courseRegistrationId !== undefined) {
        // Read from Airtable, not Postgres: the webhook fires seconds after creation, before pg-sync replicates the record.
        const courseRegistration = await db.airtableClient
          .get(courseRegistrationTable.airtable, input.courseRegistrationId)
          .catch((error: unknown) => {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Course registration not found', cause: error });
          });

        if (courseRegistration.userId) {
          return { action: 'already-linked', userId: courseRegistration.userId } as const;
        }

        const email = normaliseEmail(courseRegistration.email ?? '');
        if (!email) {
          return { action: 'skipped-no-email' } as const;
        }

        const existingUser = await db.getFirst(userTable, { filter: { email } });
        if (existingUser) {
          await db.update(courseRegistrationTable, { id: courseRegistration.id, userId: existingUser.id });
          return { action: 'linked', userId: existingUser.id } as const;
        }

        const name = [courseRegistration.firstName, courseRegistration.lastName].filter(Boolean).join(' ').trim();
        const newUser = await db.insert(userTable, {
          email,
          ...(name && { name }),
        });
        await db.update(courseRegistrationTable, { id: courseRegistration.id, userId: newUser.id });
        return { action: 'created-user-and-linked', userId: newUser.id } as const;
      }

      // 2. Link all matching course registrations if we are given a user
      // Read from Airtable, not Postgres (same reason as above): the triggering user may be brand new.
      const user = await db.airtableClient
        .get(userTable.airtable, input.userId!)
        .catch((error: unknown) => {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found', cause: error });
        });

      const email = normaliseEmail(user.email ?? '');
      if (!email) {
        return { action: 'skipped-no-email' } as const;
      }

      const canonicalUser = (await db.getFirst(userTable, { filter: { email } })) ?? user;

      const unlinkedRegistrations = await db.pg
        .select()
        .from(courseRegistrationTable.pg)
        .where(and(
          sql`lower(trim(${courseRegistrationTable.pg.email})) = ${email}`,
          or(isNull(courseRegistrationTable.pg.userId), eq(courseRegistrationTable.pg.userId, '')),
        ));

      await Promise.all(unlinkedRegistrations.map((registration) => db.update(courseRegistrationTable, {
        id: registration.id,
        userId: canonicalUser.id,
      })));

      return { action: 'linked-user-registrations', userId: canonicalUser.id, linkedCount: unlinkedRegistrations.length } as const;
    }),

  // Self-serve registration now lives in selfServeCourseRegistrations.ensureExists; these two are
  // kept as backwards-compatible aliases for clients on the old routes. These can be deleted after ~2026-06-17
  ensureExists: ensureSelfServeRegistrationExistsProcedure,
  ensureSelfServeRegistrationExists: ensureSelfServeRegistrationExistsProcedure,
});
