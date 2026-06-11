import {
  and,
  chunkTable,
  courseRegistrationTable,
  desc,
  eq,
  exerciseResponseTable,
  exerciseTable,
  gte,
  ilike,
  inArray,
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
  adminProcedure, checkAdminAccess, checkImpersonationAccess, protectedProcedure, publicProcedure, router,
} from '../trpc';

type UserSearchResult = {
  id: string;
  email: string;
  name: string | null;
  lastSeenAt: string | null;
  courseCount: number;
};

export const adminRouter = router({
  isUserAdmin: publicProcedure.query(async ({ ctx }) => {
    if (!ctx.auth) return false;
    const realEmail = ctx.impersonation?.adminEmail ?? ctx.auth.email;
    return checkAdminAccess(realEmail);
  }),
  canImpersonate: protectedProcedure.query(async ({ ctx }) => {
    const realEmail = ctx.impersonation?.adminEmail ?? ctx.auth.email;
    const { access } = await checkImpersonationAccess(realEmail);
    return access;
  }),

  searchUsers: protectedProcedure
    .input(z.object({
      searchTerm: z.string().max(500).optional(),
      // 'impersonate' = admin or scoped impersonator (restricted); 'all' = admin only.
      scope: z.enum(['impersonate', 'all']).default('impersonate'),
    }))
    .query(async ({ ctx, input }) => {
      const realEmail = ctx.impersonation?.adminEmail ?? ctx.auth.email;

      let scopeClause;
      if (input.scope === 'all') {
        if (!await checkAdminAccess(realEmail)) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
        }

        scopeClause = sql`TRUE`;
      } else {
        const { access, allowedTargets } = await checkImpersonationAccess(realEmail);
        if (access === 'none') {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
        }

        scopeClause = access === 'scoped'
          ? sql`u.id IN (${sql.join(allowedTargets.map((id) => sql`${id}`), sql`, `)})`
          : sql`TRUE`;
      }

      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      const trimmedSearchTerm = (input.searchTerm || '').trim();

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

  /**
   * Used to populate user info and filters in /admin/exercises
   */
  getUserExerciseResponsesMetaInfo: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ input }) => {
      const user = await db.getFirst(userTable, { filter: { id: input.userId } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const userCourses = await db.pg
        .selectDistinct({ courseId: exerciseTable.pg.courseId })
        .from(exerciseResponseTable.pg)
        .innerJoin(exerciseTable.pg, eq(exerciseResponseTable.pg.exerciseId, exerciseTable.pg.id))
        .where(and(
          eq(exerciseResponseTable.pg.email, user.email),
          isNotNull(exerciseTable.pg.courseId),
        ));

      const courseIds = userCourses.map((r) => r.courseId).filter((id): id is string => !!id);
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
        courses,
      };
    }),

  getUserExerciseResponses: adminProcedure
    .input(z.object({
      userId: z.string().min(1),
      cursor: z.number().int().min(0).default(0),
      limit: z.number().int().min(1).max(100).default(20),
      courseId: z.string().optional(),
      includeInProgress: z.boolean().default(false),
      search: z.string().max(500).optional(),
    }))
    .query(async ({ input }) => {
      // Step 1: Fetch data
      const user = await db.getFirst(userTable, { filter: { id: input.userId } });
      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
      }

      const trimmedSearch = input.search?.trim();
      const where = and(
        eq(exerciseResponseTable.pg.email, user.email),
        input.courseId ? eq(exerciseTable.pg.courseId, input.courseId) : undefined,
        input.includeInProgress ? undefined : isNotNull(exerciseResponseTable.pg.completedAt),
        trimmedSearch ? or(
          ilike(exerciseResponseTable.pg.response, `%${trimmedSearch}%`),
          ilike(exerciseTable.pg.title, `%${trimmedSearch}%`),
          ilike(exerciseTable.pg.description, `%${trimmedSearch}%`),
        ) : undefined,
      );

      const rows = await db.pg
        .select({
          response: {
            id: exerciseResponseTable.pg.id,
            response: exerciseResponseTable.pg.response,
            completedAt: exerciseResponseTable.pg.completedAt,
            createdAt: exerciseResponseTable.pg.createdAt,
          },
          exercise: exerciseTable.pg,
          unit: unitTable.pg,
        })
        .from(exerciseResponseTable.pg)
        .leftJoin(exerciseTable.pg, eq(exerciseResponseTable.pg.exerciseId, exerciseTable.pg.id))
        .leftJoin(unitTable.pg, eq(exerciseTable.pg.unitId, unitTable.pg.id))
        .where(where)
        // Sort by "most recent activity": completedAt when set, else createdAt (when the draft was started).
        .orderBy(sql`COALESCE(${exerciseResponseTable.pg.completedAt}, ${exerciseResponseTable.pg.createdAt}) DESC NULLS LAST`, desc(exerciseResponseTable.pg.createdAt))
        .limit(input.limit + 1)
        .offset(input.cursor);

      const hasMore = rows.length > input.limit;
      const pageRows = rows.slice(0, input.limit);

      // Locate each response's exercise inside its unit's chunks so we can show "chunk N, exercise M"
      // and link to the chunk URL (`/courses/<slug>/<unit>/<N>`).
      const unitIdsOnPage = [...new Set(pageRows.map((r) => r.exercise?.unitId).filter((id): id is string => !!id))];
      const unitChunks = unitIdsOnPage.length > 0
        ? await db.pg
          .select({ unitId: chunkTable.pg.unitId, chunkOrder: chunkTable.pg.chunkOrder, chunkExercises: chunkTable.pg.chunkExercises })
          .from(chunkTable.pg)
          .where(inArray(chunkTable.pg.unitId, unitIdsOnPage))
        : [];

      // Step 2: Calculate synthetic results
      const chunksByUnit = new Map<string, { chunkOrder: string; chunkExercises: string[] | null }[]>();
      for (const c of unitChunks) {
        const list = chunksByUnit.get(c.unitId) ?? [];
        list.push({ chunkOrder: c.chunkOrder, chunkExercises: c.chunkExercises });
        chunksByUnit.set(c.unitId, list);
      }

      for (const list of chunksByUnit.values()) {
        list.sort((a, b) => parseFloat(a.chunkOrder) - parseFloat(b.chunkOrder));
      }

      const itemsWithChunkInfo = pageRows.map((r) => {
        let chunkPosition: number | null = null;
        let exercisePosition: number | null = null;
        if (r.exercise?.unitId && r.exercise.id) {
          const chunks = chunksByUnit.get(r.exercise.unitId) ?? [];
          for (let i = 0; i < chunks.length; i += 1) {
            const idx = chunks[i]!.chunkExercises?.indexOf(r.exercise.id) ?? -1;
            if (idx >= 0) {
              chunkPosition = i + 1;
              exercisePosition = idx + 1;
              break;
            }
          }
        }

        return { ...r, chunkPosition, exercisePosition };
      });

      return {
        items: itemsWithChunkInfo,
        nextCursor: hasMore ? input.cursor + input.limit : null,
      };
    }),
});

export type UserExerciseResponseItem = inferRouterOutputs<typeof adminRouter>['getUserExerciseResponses']['items'][number];
