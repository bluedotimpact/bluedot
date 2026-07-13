import {
  and,
  courseRegistrationTable,
  desc,
  eq,
  isNull,
  or,
  sql,
  userTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { verifyPublicToken } from '../../lib/api/utils';
import { publicProcedure, router } from '../trpc';

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

export const courseRegistrationLinkingRouter = router({
  link: publicProcedure
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
});
