import {
  and,
  arrayContains,
  courseRegistrationTable,
  courseTable,
  eq,
  exerciseResponseTable,
  exerciseTable,
  groupTable,
  inArray,
  isNotNull,
  meetPersonTable,
} from '@bluedot/db';
import { z } from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, publicProcedure, router } from '../trpc';

export const exercisesRouter = router({
  getExercise: publicProcedure
    .input(z.object({ exerciseId: z.string().min(1) }))
    .query(async ({ input }) => {
      return db.get(exerciseTable, { id: input.exerciseId });
    }),

  getExerciseResponse: protectedProcedure
    .input(z.object({ exerciseId: z.string().min(1) }))
    .query(async ({ input, ctx }) => {
      const exerciseResponse = await db.getFirst(exerciseResponseTable, {
        filter: { exerciseId: input.exerciseId, email: ctx.auth.email },
      });

      return exerciseResponse;
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

      const exerciseResponse = await db.getFirst(exerciseResponseTable, {
        filter: { exerciseId: input.exerciseId, email: ctx.auth.email },
      });

      if (exerciseResponse) {
        return db.update(exerciseResponseTable, {
          id: exerciseResponse.id,
          exerciseId: input.exerciseId,
          response: input.response,
          completedAt: completedAt !== undefined ? completedAt : exerciseResponse.completedAt,
        });
      }

      return db.insert(exerciseResponseTable, {
        email: ctx.auth.email,
        exerciseId: input.exerciseId,
        response: input.response,
        completedAt: completedAt ?? null,
      });
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
        return null;
      }

      // 2. Find caller's registration
      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          courseId: course.id,
          roundStatus: 'Active',
          decision: 'Accept',
        },
      });
      if (!courseRegistration) {
        return null;
      }

      // 3. Find meetPerson record and verify facilitator role
      const meetPerson = await db.getFirst(meetPersonTable, {
        filter: { applicationsBaseRecordId: courseRegistration.id },
      });
      if (!meetPerson || meetPerson.role !== 'Facilitator') {
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
          email: exerciseResponseTable.pg.email,
          response: exerciseResponseTable.pg.response,
        })
        .from(exerciseResponseTable.pg)
        .where(and(
          eq(exerciseResponseTable.pg.exerciseId, input.exerciseId),
          inArray(exerciseResponseTable.pg.email, allEmails),
          isNotNull(exerciseResponseTable.pg.completedAt),
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
          if (response != null) {
            responses.push({ name: p.name ?? 'Anonymous', response });
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
