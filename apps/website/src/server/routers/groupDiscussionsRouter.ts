import { groupDiscussionTable, groupTable, unitTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { publicProcedure, router } from '../trpc';

export const groupDiscussionsRouter = router({
  getByDiscussionId: publicProcedure
    .input(z.object({ discussionId: z.string() }))
    .query(async ({ input: { discussionId } }) => {
      const discussion = await db.getFirst(groupDiscussionTable, {
        filter: { id: discussionId },
      });

      if (!discussion) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Discussion not found' });
      }

      if (!discussion.courseBuilderUnitRecordId) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Discussion is missing unit reference' });
      }

      const group = await db.getFirst(groupTable, {
        filter: { id: discussion.group },
      });

      if (!group) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Related group not found' });
      }

      const unit = await db.getFirst(unitTable, {
        filter: { id: discussion.courseBuilderUnitRecordId },
      });

      if (!unit) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Associated unit not found' });
      }

      return {
        discussion: {
          ...discussion,
          groupId: discussion.group,
          groupDetails: group,
          unitRecord: unit,
        },
      };
    }),
});
