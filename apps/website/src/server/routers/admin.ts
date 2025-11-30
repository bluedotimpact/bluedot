import {
  syncRequestsTable, gte, desc, userTable, courseRegistrationTable, sql,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import {
  adminProcedure, checkAdminAccess, protectedProcedure, router,
} from '../trpc';

export const adminRouter = router({
  isAdmin: protectedProcedure.query(async ({ ctx }) => {
    return checkAdminAccess(ctx.auth.email);
  }),
  searchUsers: adminProcedure
    .input(z.object({ query: z.string().max(200).optional() }))
    .query(async ({ input }) => {
      const trimmedQuery = (input.query || '').trim();

      // Build WHERE clause based on query
      let whereClause;
      if (!trimmedQuery) {
        whereClause = sql`TRUE`;
      } else if (z.string().email().safeParse(trimmedQuery).success) {
        whereClause = sql`LOWER(u.email) = LOWER(${trimmedQuery})`;
      } else {
        whereClause = sql`u.name ILIKE ${`%${trimmedQuery}%`}`;
      }

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
        WHERE ${whereClause}
        ORDER BY u."lastSeenAt" DESC NULLS LAST
        LIMIT 20
      `);

      return results.rows.map((row) => ({
        id: row.id as string,
        email: row.email as string,
        name: row.name as string | null,
        lastSeenAt: row.lastSeenAt as string | null,
        courseCount: row.courseCount as number,
      }));
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
