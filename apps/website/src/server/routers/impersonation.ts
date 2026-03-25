import {
  userTable, courseRegistrationTable, sql,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import {
  checkImpersonationAccess, protectedProcedure, router,
} from '../trpc';

export const impersonationRouter = router({
  canImpersonate: protectedProcedure.query(async ({ ctx }) => {
    const { access } = await checkImpersonationAccess(ctx.auth.email);
    return access;
  }),

  searchTargets: protectedProcedure
    .input(z.object({ searchTerm: z.string().max(200).optional() }))
    .query(async ({ ctx, input }) => {
      const { access, allowedTargets } = await checkImpersonationAccess(ctx.auth.email);

      if (access === 'none') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Unauthorized' });
      }

      // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
      const trimmedSearchTerm = (input.searchTerm || '').trim();

      if (access === 'admin') {
        // Admins get full user search
        let whereClause;
        if (!trimmedSearchTerm) {
          whereClause = sql`TRUE`;
        } else {
          const pattern = `%${trimmedSearchTerm}%`;
          whereClause = sql`(u.email ILIKE ${pattern} OR u.name ILIKE ${pattern})`;
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
          ORDER BY
            CASE WHEN LOWER(u.email) = LOWER(${trimmedSearchTerm}) THEN 0 ELSE 1 END,
            u."lastSeenAt" DESC NULLS LAST
          LIMIT 20
        `);

        return results.rows as UserSearchResult[];
      }

      // Scoped users: return only their allowed targets, with optional name/email filtering
      const idList = sql.join(allowedTargets.map((id) => sql`${id}`), sql`, `);
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
        WHERE u.id IN (${idList})
        ${trimmedSearchTerm ? sql`AND (u.email ILIKE ${`%${trimmedSearchTerm}%`} OR u.name ILIKE ${`%${trimmedSearchTerm}%`})` : sql``}
        ORDER BY u.name ASC NULLS LAST
      `);

      return results.rows as UserSearchResult[];
    }),
});

type UserSearchResult = {
  id: string;
  email: string;
  name: string | null;
  lastSeenAt: string | null;
  courseCount: number;
};
