import {
  and,
  courseRegistrationTable, courseTable,
  eq,
  groupDiscussionTable, groupTable, meetPersonTable,
  sql,
  unitTable,
  zoomAccountTable,
} from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';

export type GroupDiscussionWithGroupAndUnit = inferRouterOutputs<
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

      if (discussions.length !== discussionIds.length) {
        const foundIds = new Set(discussions.map((d) => d.id));
        const missingIds = discussionIds.filter((id) => !foundIds.has(id));
        logger.error(`Some group discussions not found for the provided IDs: ${missingIds.join(', ')}`);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Some group discussions not found for the provided IDs: ${missingIds.join(', ')}`,
        });
      }

      const groupIds = [...new Set(discussions.map((d) => d.group))];
      const unitIds = [...new Set(discussions.map((d) => d.courseBuilderUnitRecordId).filter((id): id is string => !!id))];

      const [groups, units] = await Promise.all([
        db.scan(groupTable, {
          OR: groupIds.map((id) => ({ id })),
        }),
        db.scan(unitTable, {
          OR: unitIds.map((id) => ({ id })),
        }),
      ]);

      // Lookup maps from ID to record
      const groupMap = new Map(groups.map((g) => [g.id, g]));
      const unitMap = new Map(units.map((u) => [u.id, u]));

      const discussionsWithDetails = discussions.map((discussion) => {
        const group = groupMap.get(discussion.group);
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        const unit = (discussion.courseBuilderUnitRecordId && unitMap.get(discussion.courseBuilderUnitRecordId)) || null;

        if (!group) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: `Related group not found for discussion ${discussion.id}`,
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

  getByCourseSlug: protectedProcedure
    .input(z.object({ courseSlug: z.string() }))
    .query(async ({ ctx, input: { courseSlug } }) => {
      const course = await db.get(courseTable, { slug: courseSlug });
      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Course not found for slug: ${courseSlug}` });
      }

      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          decision: 'Accept',
          courseId: course.id,
        },
      });

      if (!courseRegistration) {
        return null;
      }

      const participant = await db.getFirst(meetPersonTable, {
        filter: { applicationsBaseRecordId: courseRegistration.id },
      });

      if (!participant) {
        return null;
      }

      const roundId = participant.round;
      if (!roundId) {
        return null;
      }

      const currentTimeMs = Date.now();

      const groupDiscussions = await db.pg.select()
        .from(groupDiscussionTable.pg)
        .where(and(
          eq(groupDiscussionTable.pg.round, roundId),
          sql`(${groupDiscussionTable.pg.participantsExpected} @> ARRAY[${participant.id}] OR ${groupDiscussionTable.pg.facilitators} @> ARRAY[${participant.id}])`,
        ))
        .orderBy(groupDiscussionTable.pg.startDateTime);

      // Get the first discussion that hasn't ended (already ordered by start time)
      const groupDiscussion = groupDiscussions.find((d) => getDiscussionTimeState({ discussion: d, currentTimeMs }) !== 'ended') ?? null;

      // Determine user role and get host key if facilitator
      let userRole: 'participant' | 'facilitator' | undefined;
      let hostKeyForFacilitators: string | undefined;

      if (groupDiscussion?.facilitators.includes(participant.id)) {
        userRole = 'facilitator';

        if (groupDiscussion.zoomAccount) {
          try {
            const zoomAccount = await db.get(zoomAccountTable, { id: groupDiscussion.zoomAccount });
            hostKeyForFacilitators = zoomAccount.hostKey || undefined;
          } catch {
            hostKeyForFacilitators = undefined;
          }
        }
      } else if (groupDiscussion?.participantsExpected.includes(participant.id)) {
        userRole = 'participant';
      }

      return {
        groupDiscussion,
        userRole,
        hostKeyForFacilitators,
      };
    }),

});
