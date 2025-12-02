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
import { slackAlert } from '@bluedot/utils/src/slackNotifications';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { protectedProcedure, publicProcedure, router } from '../trpc';

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

      const rawDiscussions = await db.scan(groupDiscussionTable, {
        OR: discussionIds.map((id) => ({ id })),
      });

      if (rawDiscussions.length !== discussionIds.length) {
        const foundIds = new Set(rawDiscussions.map((d) => d.id));
        const missingIds = discussionIds.filter((id) => !foundIds.has(id));
        logger.error(`Some group discussions not found for the provided IDs: ${missingIds.join(', ')}`);
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Some group discussions not found for the provided IDs: ${missingIds.join(', ')}`,
        });
      }

      // There are cases where `courseBuilderUnitRecordId` is missing for unknown reasons,
      // filter these out so we can proceed with as many valid discussions as we can.
      // See https://github.com/bluedotimpact/bluedot/issues/1557 for discussion of the underlying issue.
      const validDiscussions = rawDiscussions.filter((d) => !!d.courseBuilderUnitRecordId);

      if (validDiscussions.length < rawDiscussions.length) {
        const invalidIds = rawDiscussions.filter((d) => !validDiscussions.includes(d)).map((d) => d.id);
        const errorMessage = `Discussions missing unit reference: ${invalidIds.join(', ')}`;
        logger.error(errorMessage);
        await slackAlert(env, [errorMessage]);
      }

      if (validDiscussions.length === 0) {
        return { discussions: [] };
      }

      const groupIds = [...new Set(validDiscussions.map((d) => d.group))];
      const unitIds = [...new Set(validDiscussions.map((d) => d.courseBuilderUnitRecordId!))];

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

      const discussionsWithDetails = validDiscussions.map((discussion) => {
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

      const currentTimeSeconds = Math.floor(Date.now() / 1000);

      // Get all discussions that haven't ended yet
      const groupDiscussions = await db.pg.select()
        .from(groupDiscussionTable.pg)
        .where(
          and(
            eq(groupDiscussionTable.pg.round, roundId),
            sql`(${groupDiscussionTable.pg.participantsExpected} @> ARRAY[${participant.id}] OR ${groupDiscussionTable.pg.facilitators} @> ARRAY[${participant.id}])`,
            sql`${groupDiscussionTable.pg.endDateTime} > ${currentTimeSeconds}`,
          ),
        )
        .orderBy(groupDiscussionTable.pg.startDateTime);

      // Priority: Show ongoing meeting, otherwise show next upcoming
      const ongoingDiscussion = groupDiscussions.find((d) => d.startDateTime <= currentTimeSeconds && d.endDateTime > currentTimeSeconds);
      const upcomingDiscussion = groupDiscussions.find((d) => d.startDateTime > currentTimeSeconds);
      const groupDiscussion = ongoingDiscussion ?? upcomingDiscussion ?? null;

      // Determine user role and get host key if facilitator
      let userRole: 'participant' | 'facilitator' | undefined;
      let hostKeyForFacilitators: string | undefined;

      if (groupDiscussion?.facilitators.includes(participant.id)) {
        userRole = 'facilitator';

        if (groupDiscussion.zoomAccount) {
          try {
            const zoomAccount = await db.get(zoomAccountTable, { id: groupDiscussion.zoomAccount });
            hostKeyForFacilitators = zoomAccount.hostKey || undefined;
          } catch (error) {
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
