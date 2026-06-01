import {
  and,
  courseRegistrationTable,
  desc,
  eq,
  exerciseResponseTable,
  exerciseTable,
  gte,
  ilike,
  inArray,
  isNull,
  isNotNull,
  or,
  sql,
  syncRequestsTable,
  unitTable,
  userTable,
} from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import {
  adminProcedure, checkAdminAccess, checkImpersonationAccess, protectedProcedure, router,
} from '../trpc';

type UserSearchResult = {
  id: string;
  email: string;
  name: string | null;
  lastSeenAt: string | null;
  courseCount: number;
};

// Extension point: today only admins can view a user's exercise responses, but the
// expected next consumer is "facilitator viewing their participants". Add that branch
// here rather than at call sites.
const canViewUserExerciseResponses = async (viewerEmail: string, _targetUserId: string): Promise<boolean> => {
  return checkAdminAccess(viewerEmail);
};

export const adminRouter = router({
  canImpersonate: protectedProcedure.query(async ({ ctx }) => {
    const realEmail = ctx.impersonation?.adminEmail ?? ctx.auth.email;
    const { access } = await checkImpersonationAccess(realEmail);
    return access;
  }),

  searchUsers: protectedProcedure
    .input(z.object({ searchTerm: z.string().max(200).optional() }))
    .query(async ({ ctx, input }) => {
      const realEmail = ctx.impersonation?.adminEmail ?? ctx.auth.email;
      const { access, allowedTargets } = await checkImpersonationAccess(realEmail);

      if (access === 'none') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
      }

      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      const trimmedSearchTerm = (input.searchTerm || '').trim();

      // Build WHERE clause: scoped users are restricted to their allowed targets
      const scopeClause = access === 'scoped'
        ? sql`u.id IN (${sql.join(allowedTargets.map((id) => sql`${id}`), sql`, `)})`
        : sql`TRUE`;

      const searchClause = trimmedSearchTerm
        ? sql`(u.email ILIKE ${`%${trimmedSearchTerm}%`} OR u.name ILIKE ${`%${trimmedSearchTerm}%`})`
        : sql`TRUE`;

      // When searching, sort exact email matches first; otherwise sort test users first
      const orderClause = trimmedSearchTerm
        ? sql`CASE WHEN LOWER(u.email) = LOWER(${trimmedSearchTerm}) THEN 0 ELSE 1 END, u."lastSeenAt" DESC NULLS LAST`
        : sql`CASE WHEN u.email ILIKE '%test%' OR u.name ILIKE '%test%' THEN 0 ELSE 1 END, u."lastSeenAt" DESC NULLS LAST`;

      const results = await db.pg.execute(sql`
        SELECT
          u.id,
          u.email,
          u.name,
          u."lastSeenAt",
          COALESCE(
            (SELECT COUNT(*)
             FROM ${courseRegistrationTable.pg} cr
             WHERE cr.email = u.email AND (cr."certificateId" IS NOT NULL OR cr.decision = 'Accepted')),
            0
          )::int AS "courseCount"
        FROM ${userTable.pg} u
        WHERE ${scopeClause} AND ${searchClause}
        ORDER BY ${orderClause}
        LIMIT 20
      `);

      return results.rows as UserSearchResult[];
    }),
  syncHistory: adminProcedure.query(async () => {
    // Get last 24 hours of requests, newest first
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    return db.pg
      .select()
      .from(syncRequestsTable)
      .where(gte(syncRequestsTable.requestedAt, twentyFourHoursAgo))
      .orderBy(desc(syncRequestsTable.requestedAt));
  }),

  requestSync: adminProcedure.mutation(async ({ ctx }) => {
    const syncRequestResult = await db.pg
      .insert(syncRequestsTable)
      .values({
        requestedBy: ctx.auth.email,
        status: 'queued',
      })
      .returning();

    if (!syncRequestResult?.[0]?.id) {
      throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to create sync request' });
    }

    return {
      requestId: syncRequestResult[0].id,
    };
  }),

  getUserExerciseResponses: protectedProcedure
    .input(z.object({
      userId: z.string().min(1),
      cursor: z.number().int().min(0).default(0),
      limit: z.number().int().min(1).max(100).default(20),
      courseId: z.string().optional(),
      status: z.enum(['all', 'completed', 'in-progress']).default('all'),
      search: z.string().max(200).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const realEmail = ctx.impersonation?.adminEmail ?? ctx.auth.email;
      if (!await canViewUserExerciseResponses(realEmail, input.userId)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
      }

      const user = await db.getFirst(userTable, { filter: { id: input.userId } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const trimmedSearch = input.search?.trim();
      const where = and(
        eq(exerciseResponseTable.pg.email, user.email),
        input.courseId ? eq(exerciseTable.pg.courseId, input.courseId) : undefined,
        input.status === 'completed' ? isNotNull(exerciseResponseTable.pg.completedAt) : undefined,
        input.status === 'in-progress' ? isNull(exerciseResponseTable.pg.completedAt) : undefined,
        trimmedSearch ? or(
          ilike(exerciseResponseTable.pg.response, `%${trimmedSearch}%`),
          ilike(exerciseTable.pg.title, `%${trimmedSearch}%`),
          ilike(exerciseTable.pg.description, `%${trimmedSearch}%`),
        ) : undefined,
      );

      const rows = await db.pg
        .select({
          response: exerciseResponseTable.pg,
          exercise: exerciseTable.pg,
          unit: unitTable.pg,
        })
        .from(exerciseResponseTable.pg)
        .leftJoin(exerciseTable.pg, eq(exerciseResponseTable.pg.exerciseId, exerciseTable.pg.id))
        .leftJoin(unitTable.pg, eq(exerciseTable.pg.unitId, unitTable.pg.id))
        .where(where)
        .orderBy(sql`${exerciseResponseTable.pg.completedAt} DESC NULLS LAST`, desc(exerciseResponseTable.pg.autoNumberId))
        .limit(input.limit + 1)
        .offset(input.cursor);

      const hasMore = rows.length > input.limit;
      const pageRows = rows.slice(0, input.limit);

      // For the LHS filter, show all courses this user has any response in (regardless of current filter)
      const allUserExercises = await db.pg
        .selectDistinct({ courseId: exerciseTable.pg.courseId })
        .from(exerciseResponseTable.pg)
        .innerJoin(exerciseTable.pg, eq(exerciseResponseTable.pg.exerciseId, exerciseTable.pg.id))
        .where(and(
          eq(exerciseResponseTable.pg.email, user.email),
          isNotNull(exerciseTable.pg.courseId),
        ));
      const courseIds = allUserExercises.map((r) => r.courseId).filter((id): id is string => !!id);
      const courses = courseIds.length > 0
        ? await db.pg
          .select({ id: unitTable.pg.courseId, title: unitTable.pg.courseTitle })
          .from(unitTable.pg)
          .where(inArray(unitTable.pg.courseId, courseIds))
          .groupBy(unitTable.pg.courseId, unitTable.pg.courseTitle)
        : [];

      return {
        user: {
          id: user.id, email: user.email, name: user.name, lastSeenAt: user.lastSeenAt,
        },
        items: pageRows,
        nextCursor: hasMore ? input.cursor + input.limit : null,
        courses,
      };
    }),
});

export type UserExerciseResponseItem = inferRouterOutputs<typeof adminRouter>['getUserExerciseResponses']['items'][number];
