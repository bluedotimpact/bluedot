import { groupDiscussionTable, groupTable, unitTable } from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export type GroupDiscussion = inferRouterOutputs<
  typeof groupDiscussionsRouter
>['getByDiscussionIds']['discussions'][number];

export const groupDiscussionsRouter = router({
  getByDiscussionIds: publicProcedure
    .input(z.object({ discussionIds: z.array(z.string()) }))
    .query(async ({ input: { discussionIds } }) => {
      if (discussionIds.length === 0) {
        return { discussions: [] };
      }

      const discussions = await db.scan(groupDiscussionTable, {
        OR: discussionIds.map((id) => ({ id })),
      });

      if (discussions.length === 0) {
        return { discussions: [] };
      }

      const invalidDiscussions = discussions.filter((d) => !d.courseBuilderUnitRecordId);
      if (invalidDiscussions.length > 0) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Discussions missing unit reference: ${invalidDiscussions.map((d) => d.id).join(', ')}`,
        });
      }

      const groupIds = [...new Set(discussions.map((d) => d.group))];
      const unitIds = [...new Set(discussions.map((d) => d.courseBuilderUnitRecordId).filter(Boolean))] as string[];

      // Fetch all groups and units in parallel with only one DB call each
      const [groups, units] = await Promise.all([
        db.scan(groupTable, {
          OR: groupIds.map((id) => ({ id })),
        }),
        db.scan(unitTable, {
          OR: unitIds.map((id) => ({ id })),
        }),
      ]);

      // Lookup maps
      const groupMap = new Map(groups.map((g) => [g.id, g]));
      const unitMap = new Map(units.map((u) => [u.id, u]));

      const discussionsWithDetails = discussions.map((discussion) => {
        const group = groupMap.get(discussion.group);
        const unit = unitMap.get(discussion.courseBuilderUnitRecordId!);

        if (!group) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Related group not found for discussion ${discussion.id}`,
          });
        }

        if (!unit) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Associated unit not found for discussion ${discussion.id}`,
          });
        }

        return {
          ...discussion,
          groupDetails: group,
          unitRecord: unit,
        };
      });

      return { discussions: discussionsWithDetails };
    }),
});
