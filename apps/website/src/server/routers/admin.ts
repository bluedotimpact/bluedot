import {
  syncRequestsTable, gte, desc, userTable, courseRegistrationTable, sql,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import {
  adminProcedure, checkImpersonationAccess, protectedProcedure, router,
} from '../trpc';

type UserSearchResult = {
  id: string;
  email: string;
  name: string | null;
  lastSeenAt: string | null;
  courseCount: number;
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
});
