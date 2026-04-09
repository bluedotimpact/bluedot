import {
  and,
  courseRegistrationTable,
  courseTable,
  eq,
  groupDiscussionTable,
  groupTable,
  inArray,
  isNull,
  meetPersonTable,
  or,
  sql,
  unitTable,
  zoomAccountTable,
} from '@bluedot/db';
import { logger } from '@bluedot/ui/src/api';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { getDiscussionTimeState } from '../../lib/group-discussions/utils';
import { protectedProcedure, publicProcedure, router } from '../trpc';

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

      // Get all accepted course registrations for this course (not just the first),
      // so facilitators with discussions across multiple rounds see the soonest one
      const courseRegistrations = await db.pg
        .select()
        .from(courseRegistrationTable.pg)
        .where(and(
          eq(courseRegistrationTable.pg.email, ctx.auth.email),
          eq(courseRegistrationTable.pg.courseId, course.id),
          eq(courseRegistrationTable.pg.decision, 'Accept'),
          or(
            eq(courseRegistrationTable.pg.isDuplicate, false),
            isNull(courseRegistrationTable.pg.isDuplicate),
          ),
        ));

      if (courseRegistrations.length === 0) {
        return null;
      }

      // Get meetPerson records for all registrations in a single query
      const participants = await db.pg
        .select()
        .from(meetPersonTable.pg)
        .where(inArray(meetPersonTable.pg.applicationsBaseRecordId, courseRegistrations.map((r) => r.id)));

      if (participants.length === 0) {
        return null;
      }

      const roundIds = [...new Set(participants.map((p) => p.round).filter((r): r is string => !!r))];
      const participantIds = participants.map((p) => p.id);

      if (roundIds.length === 0) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Round not found for participant' });
      }

      const currentTimeMs = Date.now();

      // Query discussions across all rounds where the user is a participant or facilitator
      const groupDiscussions = await db.pg
        .select()
        .from(groupDiscussionTable.pg)
        .where(and(
          inArray(groupDiscussionTable.pg.round, roundIds),
          sql`(${groupDiscussionTable.pg.participantsExpected} && ARRAY[${sql.join(participantIds.map((id) => sql`${id}`), sql`, `)}]::text[] OR ${groupDiscussionTable.pg.facilitators} && ARRAY[${sql.join(participantIds.map((id) => sql`${id}`), sql`, `)}]::text[])`,
        ))
        .orderBy(groupDiscussionTable.pg.startDateTime);

      // Get the first discussion that hasn't ended (already ordered by start time)
      const groupDiscussion = groupDiscussions.find((d) => getDiscussionTimeState({ discussion: d, currentTimeMs }) !== 'ended') ?? null;

      // Determine user role and get host key if facilitator
      let userRole: 'participant' | 'facilitator' | undefined;
      let hostKeyForFacilitators: string | undefined;

      if (groupDiscussion) {
        const isFacilitator = participantIds.some((id) => groupDiscussion.facilitators.includes(id));
        const isParticipant = participantIds.some((id) => groupDiscussion.participantsExpected.includes(id));

        if (isFacilitator) {
          userRole = 'facilitator';

          if (groupDiscussion.zoomAccount) {
            try {
              const zoomAccount = await db.get(zoomAccountTable, { id: groupDiscussion.zoomAccount });
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
              hostKeyForFacilitators = zoomAccount.hostKey || undefined;
            } catch {
              hostKeyForFacilitators = undefined;
            }
          }
        } else if (isParticipant) {
          userRole = 'participant';
        }
      }

      return {
        groupDiscussion,
        userRole,
        hostKeyForFacilitators,
      };
    }),
});
