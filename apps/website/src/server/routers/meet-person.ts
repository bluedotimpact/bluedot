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
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const meetPersonRouter = router({
  getByCourseRegistrationId: protectedProcedure
    .input(z.object({ courseRegistrationId: z.string() }))
    .query(async ({ input: { courseRegistrationId }, ctx }) => {
      return db.getFirst(meetPersonTable, {
        filter: {
          applicationsBaseRecordId: courseRegistrationId,
          email: ctx.auth.email,
        },
      });
    }),

  getInactiveCourseRegistrations: protectedProcedure
    .input(z.object({ courseSlug: z.string().min(1).optional() }))
    .query(async ({ ctx, input }) => {
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
          eq(courseRegistrationTable.pg.email, ctx.auth.email),
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
   * Returns the people in the caller's group for a given meetPerson record. The caller must own
   * the meetPerson. Facilitators are returned first, then participants alphabetically by name.
   * Caller themselves are excluded from the list.
   */
  getGroupParticipants: protectedProcedure
    .input(z.object({ meetPersonId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const meetPersonRows = await db.pg.select()
        .from(meetPersonTable.pg)
        .where(eq(meetPersonTable.pg.id, input.meetPersonId));
      const callerMeetPerson = meetPersonRows[0];
      if (callerMeetPerson?.email !== ctx.auth.email) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'meetPerson not found' });
      }

      const groupId = callerMeetPerson.groupsAsParticipant?.[0];
      if (!groupId) return { facilitators: [], participants: [] };

      const groupRows = await db.pg.select().from(groupTable.pg).where(eq(groupTable.pg.id, groupId));
      const group = groupRows[0];
      if (!group) return { facilitators: [], participants: [] };

      const facilitatorIdsArr = group.facilitator ?? [];
      const participantIdsArr = (group.participants ?? []).filter((id) => id !== callerMeetPerson.id);
      const allIds = [...facilitatorIdsArr, ...participantIdsArr];
      if (allIds.length === 0) return { facilitators: [], participants: [] };

      const people = await db.pg
        .select({
          id: meetPersonTable.pg.id,
          name: meetPersonTable.pg.name,
        })
        .from(meetPersonTable.pg)
        .where(inArray(meetPersonTable.pg.id, allIds));
      const peopleById = new Map(people.map((p) => [p.id, { id: p.id, name: p.name ?? '' }]));

      const facilitators = facilitatorIdsArr
        .map((id) => peopleById.get(id))
        .filter((p): p is { id: string; name: string } => !!p)
        .sort((a, b) => a.name.localeCompare(b.name));

      const participants = participantIdsArr
        .map((id) => peopleById.get(id))
        .filter((p): p is { id: string; name: string } => !!p)
        .sort((a, b) => a.name.localeCompare(b.name));

      return { facilitators, participants };
    }),
});
