import {
  and,
  arrayContains,
  arrayOverlaps,
  asc,
  COURSE_ROLE,
  courseRegistrationTable,
  courseTable,
  desc,
  eq,
  exerciseResponsePgTable,
  exerciseTable,
  groupTable,
  inArray,
  isNotNull,
  isNull,
  meetPersonTable,
  or,
  roundTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import { FOAI_COURSE_ID } from '../../lib/constants';
import {
  getUserOrThrow, protectedProcedure, publicProcedure, router,
} from '../trpc';
import { issueFoaiCertificateIfComplete } from './certificates';

export const exercisesRouter = router({
  getExercise: publicProcedure
    .input(z.object({ exerciseId: z.string().min(1) }))
    .query(async ({ input }) => {
      return db.get(exerciseTable, { id: input.exerciseId });
    }),

  getExerciseResponse: protectedProcedure
    .input(z.object({ exerciseId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const user = await getUserOrThrow(ctx.auth.email);

      const [exerciseResponse] = await db.pg
        .select()
        .from(exerciseResponsePgTable.pg)
        .where(and(
          eq(exerciseResponsePgTable.pg.exerciseId, input.exerciseId),
          arrayContains(exerciseResponsePgTable.pg.userId, [user.id]),
        ))
        .orderBy(desc(exerciseResponsePgTable.pg.createdAt))
        .limit(1);

      return exerciseResponse ?? null;
    }),

  saveExerciseResponse: protectedProcedure
    .input(z.object({
      exerciseId: z.string().min(1),
      response: z.string(),
      completed: z.boolean().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      let completedAt: string | null | undefined;
      if (input.completed === true) {
        completedAt = new Date().toISOString();
      } else if (input.completed === false) {
        completedAt = null;
      } // else undefined = "don't change"

      const [exercise, user] = await Promise.all([
        input.completed === true
          ? db.getFirst(exerciseTable, { filter: { id: input.exerciseId }, sortBy: 'id' })
          : Promise.resolve(undefined),
        getUserOrThrow(ctx.auth.email),
      ]);

      const [existingResponse] = await db.pg
        .select()
        .from(exerciseResponsePgTable.pg)
        .where(and(
          eq(exerciseResponsePgTable.pg.exerciseId, input.exerciseId),
          arrayContains(exerciseResponsePgTable.pg.userId, [user.id]),
        ))
        .orderBy(desc(exerciseResponsePgTable.pg.createdAt))
        .limit(1);

      const [exerciseResponse] = existingResponse
        ? await db.pg
          .update(exerciseResponsePgTable.pg)
          .set({
            exerciseId: input.exerciseId,
            response: input.response,
            completedAt: completedAt !== undefined ? completedAt : existingResponse.completedAt,
          })
          .where(eq(exerciseResponsePgTable.pg.id, existingResponse.id))
          .returning()
        : await db.pg
          .insert(exerciseResponsePgTable.pg)
          .values({
            email: ctx.auth.email,
            exerciseId: input.exerciseId,
            response: input.response,
            // Airtable defaulted this field to now(); without Airtable it must be set in code
            createdAt: new Date().toISOString(),
            completedAt: completedAt ?? null,
            userId: [user.id],
          })
          .returning();

      if (!exerciseResponse) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to save exercise response' });

      const certificateIssued = exercise?.courseId === FOAI_COURSE_ID
        ? await issueFoaiCertificateIfComplete(user.id)
        : false;

      return { ...exerciseResponse, certificateIssued };
    }),

  getGroupExerciseResponses: protectedProcedure
    .input(z.object({
      courseSlug: z.string().min(1),
      exerciseId: z.string().min(1),
    }))
    .query(async ({ input, ctx }) => {
      // 1. Find course
      const course = await db.getFirst(courseTable, {
        filter: { slug: input.courseSlug },
        sortBy: 'slug',
      });
      if (!course) {
        throw new TRPCError({ code: 'NOT_FOUND', message: `Course not found for slug: ${input.courseSlug}` });
      }

      const user = await getUserOrThrow(ctx.auth.email);

      // 2. Find all of caller's active registrations for this course
      // roundStatus is 'Active' for live rounds, or null for self-paced courses with no round
      const courseRegistrations = await db.pg
        .select()
        .from(courseRegistrationTable.pg)
        .where(and(
          eq(courseRegistrationTable.pg.userId, user.id),
          eq(courseRegistrationTable.pg.courseId, course.id),
          eq(courseRegistrationTable.pg.decision, 'Accept'),
          or(
            eq(courseRegistrationTable.pg.isDuplicate, false),
            isNull(courseRegistrationTable.pg.isDuplicate),
          ),
          or(
            eq(courseRegistrationTable.pg.roundStatus, 'Active'),
            isNull(courseRegistrationTable.pg.roundStatus),
          ),
        ));
      if (courseRegistrations.length === 0) {
        return null;
      }

      // 3. Find facilitator meetPerson records for all registrations
      const facilitatorMeetPersons = await db.pg
        .select({ id: meetPersonTable.pg.id })
        .from(meetPersonTable.pg)
        .where(and(
          inArray(meetPersonTable.pg.applicationsBaseRecordId, courseRegistrations.map((r) => r.id)),
          eq(meetPersonTable.pg.role, COURSE_ROLE.FACILITATOR),
        ));
      if (facilitatorMeetPersons.length === 0) {
        // Return null rather than throwing — no groups/responses is a valid empty state, and throwing would trigger
        // retries unnecessarily.
        return null;
      }

      const facilitatorMeetPersonIds = facilitatorMeetPersons.map((mp) => mp.id);

      // 4. Find groups facilitated by any of these meetPersons
      const groups = await db.pg
        .select({
          id: groupTable.pg.id,
          groupName: groupTable.pg.groupName,
          participants: groupTable.pg.participants,
          round: groupTable.pg.round,
          groupNumber: groupTable.pg.groupNumber,
        })
        .from(groupTable.pg)
        .where(arrayOverlaps(groupTable.pg.facilitator, facilitatorMeetPersonIds))
        .orderBy(asc(groupTable.pg.groupNumber), asc(groupTable.pg.id));

      if (groups.length === 0) {
        return null;
      }

      const roundIds = [...new Set(groups.map((g) => g.round).filter((r): r is string => r != null))];
      const rounds = roundIds.length > 0
        ? await db.pg
          .select({ id: roundTable.pg.id, title: roundTable.pg.title, startDate: roundTable.pg.startDate })
          .from(roundTable.pg)
          .where(inArray(roundTable.pg.id, roundIds))
        : [];
      const roundById = new Map(rounds.map((r) => [r.id, r]));

      // Newest round first (groups of the same round contiguous, even if two rounds share a start
      // date); the SQL groupNumber ordering is the stable within-round tiebreak
      const startDateOf = (round: string | null) => (round ? roundById.get(round)?.startDate ?? '' : '');
      const sortedGroups = [...groups].sort((a, b) => {
        const byStartDate = startDateOf(b.round).localeCompare(startDateOf(a.round));
        if (byStartDate !== 0) return byStartDate;
        return (a.round ?? '').localeCompare(b.round ?? '');
      });

      // 5. Get all participant IDs across all groups
      const allParticipantIds = [...new Set(sortedGroups.flatMap((g) => g.participants ?? []))];
      if (allParticipantIds.length === 0) {
        return null;
      }

      const participants = await db.pg
        .select({ id: meetPersonTable.pg.id, name: meetPersonTable.pg.name, userId: meetPersonTable.pg.userId })
        .from(meetPersonTable.pg)
        .where(inArray(meetPersonTable.pg.id, allParticipantIds));

      const participantById = new Map(participants.map((p) => [p.id, p]));

      // 6. Get completed responses for this exercise from all participants
      const participantUserIds = participants.map((p) => p.userId).filter(Boolean) as string[];
      if (participantUserIds.length === 0) {
        return null;
      }

      const exerciseResponses = await db.pg
        .select({
          userId: exerciseResponsePgTable.pg.userId,
          response: exerciseResponsePgTable.pg.response,
        })
        .from(exerciseResponsePgTable.pg)
        .where(and(
          eq(exerciseResponsePgTable.pg.exerciseId, input.exerciseId),
          arrayOverlaps(exerciseResponsePgTable.pg.userId, participantUserIds),
          isNotNull(exerciseResponsePgTable.pg.completedAt),
        ));

      const responseByUserId = new Map(exerciseResponses
        .map((r) => [r.userId?.[0], r.response] as const)
        .filter((entry): entry is readonly [string, string] => entry[0] !== undefined && entry[0] !== null));

      // 7. Build per-group response data
      const groupData = sortedGroups.map((g) => {
        const groupParticipantIds = g.participants ?? [];
        const responses: { name: string; response: string }[] = [];
        for (const pid of groupParticipantIds) {
          const p = participantById.get(pid);
          if (!p?.userId) {
            continue;
          }

          const response = responseByUserId.get(p.userId);
          if (response !== undefined) {
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            responses.push({ name: p.name || 'Anonymous', response });
          }
        }

        return {
          id: g.id,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          name: g.groupName || 'Unnamed group',
          roundName: g.round ? roundById.get(g.round)?.title ?? null : null,
          groupNumber: g.groupNumber,
          totalParticipants: groupParticipantIds.length,
          responses,
        };
      });

      return { groups: groupData };
    }),
});
