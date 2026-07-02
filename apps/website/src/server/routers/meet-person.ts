import {
  and,
  courseRegistrationTable,
  courseTable,
  dropoutTable,
  eq,
  groupTable,
  inArray,
  meetPersonTable,
  notExists,
  sql,
  userTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const meetPersonRouter = router({
  getByCourseRegistrationId: protectedProcedure
    .input(z.object({ courseRegistrationId: z.string() }))
    .query(async ({ input: { courseRegistrationId }, ctx }) => {
      const user = await db.getFirst(userTable, { filter: { email: ctx.auth.email } });
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'user not found' });
      }

      return db.getFirst(meetPersonTable, {
        filter: {
          applicationsBaseRecordId: courseRegistrationId,
          userId: user.id,
        },
      });
    }),

  getInactiveCourseRegistrations: protectedProcedure
    .input(z.object({ courseSlug: z.string().min(1).optional() }))
    .query(async ({ ctx, input }) => {
      const user = await db.getFirst(userTable, { filter: { email: ctx.auth.email } });
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'user not found' });
      }

      const results = await db.pg
        .select({
          courseRegistrationId: courseRegistrationTable.pg.id,
          courseSlug: courseTable.pg.slug,
          roundId: meetPersonTable.pg.round,
        })
        .from(courseRegistrationTable.pg)
        .innerJoin(meetPersonTable.pg, eq(meetPersonTable.pg.applicationsBaseRecordId, courseRegistrationTable.pg.id))
        .innerJoin(courseTable.pg, eq(courseTable.pg.id, courseRegistrationTable.pg.courseId))
        .where(and(
          eq(courseRegistrationTable.pg.userId, user.id),
          eq(courseRegistrationTable.pg.decision, 'Accept'),
          eq(courseRegistrationTable.pg.roundStatus, 'Active'),
          // Exclude users who have dropped out or deferred
          notExists(db.pg
            .select({ one: sql`1` })
            .from(dropoutTable.pg)
            .where(sql`${courseRegistrationTable.pg.id} = ANY(${dropoutTable.pg.applicantId})`)),
          eq(meetPersonTable.pg.hasSentInactiveEmail, true),
          // Exclude users who have rejoined a group (field is empty while inactive)
          sql`coalesce(cardinality(${meetPersonTable.pg.groupsAsParticipant}), 0) = 0`,
          // Optionally filter by course slug if provided
          ...(input.courseSlug ? [eq(courseTable.pg.slug, input.courseSlug)] : []),
        ));
      return results;
    }),

  /**
   * Returns the people in a group. The caller must be a member of the group — either as a
   * facilitator or a participant. Facilitators are listed first, then participants;
   * both sorted alphabetically by name. The caller is excluded from both lists.
   */
  getGroupParticipants: protectedProcedure
    .input(z.object({ groupId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const user = await db.getFirst(userTable, { filter: { email: ctx.auth.email } });
      if (!user) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'user not found' });
      }

      const groupRows = await db.pg.select().from(groupTable.pg).where(eq(groupTable.pg.id, input.groupId));
      const group = groupRows[0];
      if (!group) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'group not found' });
      }

      const callerMeetPersons = await db.pg
        .select({ id: meetPersonTable.pg.id })
        .from(meetPersonTable.pg)
        .where(eq(meetPersonTable.pg.userId, user.id));
      const callerMeetPersonIds = new Set(callerMeetPersons.map((m) => m.id));

      const facilitatorIdsArr = group.facilitator ?? [];
      const participantIdsArr = group.participants ?? [];
      const callerIsMember = facilitatorIdsArr.some((id) => callerMeetPersonIds.has(id))
        || participantIdsArr.some((id) => callerMeetPersonIds.has(id));
      if (!callerIsMember) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'group not found' });
      }

      const otherFacilitatorIds = facilitatorIdsArr.filter((id) => !callerMeetPersonIds.has(id));
      const otherParticipantIds = participantIdsArr.filter((id) => !callerMeetPersonIds.has(id));
      const allOtherIds = [...otherFacilitatorIds, ...otherParticipantIds];
      if (allOtherIds.length === 0) return { facilitators: [], participants: [] };

      const people = await db.pg
        .select({
          id: meetPersonTable.pg.id,
          name: meetPersonTable.pg.name,
        })
        .from(meetPersonTable.pg)
        .where(inArray(meetPersonTable.pg.id, allOtherIds));
      const peopleById = new Map(people.map((p) => [p.id, { id: p.id, name: p.name ?? '' }]));

      const facilitators = otherFacilitatorIds
        .map((id) => peopleById.get(id))
        .filter((p): p is { id: string; name: string } => !!p)
        .sort((a, b) => a.name.localeCompare(b.name));

      const participants = otherParticipantIds
        .map((id) => peopleById.get(id))
        .filter((p): p is { id: string; name: string } => !!p)
        .sort((a, b) => a.name.localeCompare(b.name));

      return { facilitators, participants };
    }),
});
