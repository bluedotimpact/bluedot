import {
  and,
  arrayContains,
  COURSE_ROLE,
  courseRegistrationTable,
  courseTable,
  desc,
  eq,
  exerciseResponsePgTable,
  exerciseTable,
  getFirstFromPg,
  groupTable,
  inArray,
  isNotNull,
  isNull,
  meetPersonTable,
  or,
  userTable,
} from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import db from '../../lib/api/db';
import { FOAI_COURSE_ID } from '../../lib/constants';
import { protectedProcedure, publicProcedure, router } from '../trpc';
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
      const exerciseResponse = await getFirstFromPg(db.pg, exerciseResponsePgTable, {
        filter: { exerciseId: input.exerciseId, email: ctx.auth.email },
        sortBy: { field: 'createdAt', direction: 'desc' },
      });

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

      const [existingResponse, exercise, user] = await Promise.all([
        getFirstFromPg(db.pg, exerciseResponsePgTable, {
          filter: { exerciseId: input.exerciseId, email: ctx.auth.email },
          sortBy: { field: 'createdAt', direction: 'desc' },
        }),
        input.completed === true
          ? db.getFirst(exerciseTable, { filter: { id: input.exerciseId }, sortBy: 'id' })
          : Promise.resolve(undefined),
        db.getFirst(userTable, { filter: { email: ctx.auth.email } }),
      ]);

      const [exerciseResponse] = existingResponse
        ? await db.pg
          .update(exerciseResponsePgTable)
          .set({
            exerciseId: input.exerciseId,
            response: input.response,
            completedAt: completedAt !== undefined ? completedAt : existingResponse.completedAt,
          })
          .where(eq(exerciseResponsePgTable.id, existingResponse.id))
          .returning()
        : await db.pg
          .insert(exerciseResponsePgTable)
          .values({
            email: ctx.auth.email,
            exerciseId: input.exerciseId,
            response: input.response,
            completedAt: completedAt ?? null,
            userId: user ? [user.id] : null,
          })
          .returning();

      const certificateIssued = exercise?.courseId === FOAI_COURSE_ID
        ? await issueFoaiCertificateIfComplete(ctx.auth.email)
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

      // 2. Find caller's registration
      // roundStatus is 'Active' for live rounds, or null for self-paced courses with no round
      const courseRegistrationRows = await db.pg
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
          or(
            eq(courseRegistrationTable.pg.roundStatus, 'Active'),
            isNull(courseRegistrationTable.pg.roundStatus),
          ),
        ))
        .orderBy(desc(courseRegistrationTable.pg.autoNumberId))
        .limit(1);
      const courseRegistration = courseRegistrationRows[0] ?? null;
      if (!courseRegistration) {
        return null;
      }

      // 3. Find meetPerson record and verify facilitator role
      const meetPerson = await db.getFirst(meetPersonTable, {
        filter: { applicationsBaseRecordId: courseRegistration.id },
      });
      if (!meetPerson || meetPerson.role !== COURSE_ROLE.FACILITATOR) {
        // Return null rather than throwing — no groups/responses is a valid empty state, and throwing would trigger
        // retries unnecessarily.
        return null;
      }

      // 4. Find groups this person facilitates
      const groups = await db.pg
        .select({ id: groupTable.pg.id, groupName: groupTable.pg.groupName, participants: groupTable.pg.participants })
        .from(groupTable.pg)
        .where(arrayContains(groupTable.pg.facilitator, [meetPerson.id]));

      if (groups.length === 0) {
        return null;
      }

      // 5. Get all participant IDs across all groups
      const allParticipantIds = [...new Set(groups.flatMap((g) => g.participants ?? []))];
      if (allParticipantIds.length === 0) {
        return null;
      }

      const participants = await db.pg
        .select({ id: meetPersonTable.pg.id, name: meetPersonTable.pg.name, email: meetPersonTable.pg.email })
        .from(meetPersonTable.pg)
        .where(inArray(meetPersonTable.pg.id, allParticipantIds));

      const participantById = new Map(participants.map((p) => [p.id, p]));

      // 6. Get completed responses for this exercise from all participants
      const allEmails = participants.map((p) => p.email).filter(Boolean) as string[];
      if (allEmails.length === 0) {
        return null;
      }

      const exerciseResponses = await db.pg
        .select({
          email: exerciseResponsePgTable.email,
          response: exerciseResponsePgTable.response,
        })
        .from(exerciseResponsePgTable)
        .where(and(
          eq(exerciseResponsePgTable.exerciseId, input.exerciseId),
          inArray(exerciseResponsePgTable.email, allEmails),
          isNotNull(exerciseResponsePgTable.completedAt),
        ));

      const responseByEmail = new Map(exerciseResponses.map((r) => [r.email, r.response]));

      // 7. Build per-group response data
      const groupData = groups.map((g) => {
        const groupParticipantIds = g.participants ?? [];
        const responses: { name: string; response: string }[] = [];
        for (const pid of groupParticipantIds) {
          const p = participantById.get(pid);
          if (!p?.email) {
            continue;
          }

          const response = responseByEmail.get(p.email);
          if (response !== undefined) {
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            responses.push({ name: p.name || 'Anonymous', response });
          }
        }

        return {
          id: g.id,
          // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
          name: g.groupName || 'Unnamed group',
          totalParticipants: groupParticipantIds.length,
          responses,
        };
      });

      return { groups: groupData };
    }),
});
