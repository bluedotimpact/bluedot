import { z } from 'zod';
import {
  courseRegistrationTable,
  courseTable,
  exerciseTable,
  exerciseResponseTable,
  groupDiscussionTable,
  groupTable,
  inArray,
  meetPersonTable,
} from '@bluedot/db';
import db from '../../lib/api/db';
import { publicProcedure, protectedProcedure, router } from '../trpc';

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
      const exerciseResponse = await db.getFirst(exerciseResponseTable, {
        filter: { exerciseId: input.exerciseId, email: ctx.auth.email },
      });

      if (exerciseResponse) {
        return db.update(exerciseResponseTable, {
          id: exerciseResponse.id,
          exerciseId: input.exerciseId,
          response: input.response,
          completed: input.completed ?? exerciseResponse.completed,
        });
      }

      return db.insert(exerciseResponseTable, {
        email: ctx.auth.email,
        exerciseId: input.exerciseId,
        response: input.response,
        completed: input.completed ?? false,
      });
    }),

  getGroupExerciseResponses: protectedProcedure
    .input(z.object({
      courseSlug: z.string().min(1),
      groupId: z.string().min(1).optional(),
      // Dev flag: show all groups in the round, not just the facilitator's own
      allGroups: z.boolean().optional(),
    }))
    .query(async ({ input, ctx }) => {
      // 1. Find course
      const course = await db.getFirst(courseTable, {
        filter: { slug: input.courseSlug },
        sortBy: 'slug',
      });
      if (!course) return null;

      // 2. Find caller's registration
      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          courseId: course.id,
          roundStatus: 'Active',
          decision: 'Accept',
        },
      });
      if (!courseRegistration) return null;

      // 3. Find meetPerson record and verify facilitator role
      const meetPerson = await db.getFirst(meetPersonTable, {
        filter: { applicationsBaseRecordId: courseRegistration.id },
      });
      if (!meetPerson || meetPerson.role !== 'Facilitator') return null;

      // 4. Find groups
      let groupIds: string[];

      if (input.allGroups && meetPerson.round) {
        // Dev mode: get all groups in this round
        const allRoundGroups = await db.scan(groupTable, { round: meetPerson.round });
        groupIds = allRoundGroups.map((g) => g.id);
      } else {
        // Normal mode: only groups this person facilitates
        const facilitatorDiscussionIds = meetPerson.expectedDiscussionsFacilitator || [];
        if (facilitatorDiscussionIds.length === 0) return null;

        const groupDiscussions = await db.pg
          .select({ group: groupDiscussionTable.pg.group })
          .from(groupDiscussionTable.pg)
          .where(inArray(groupDiscussionTable.pg.id, facilitatorDiscussionIds));

        groupIds = [...new Set(groupDiscussions.map((d) => d.group))];
      }

      if (groupIds.length === 0) return null;

      const groups = await db.pg
        .select({ id: groupTable.pg.id, groupName: groupTable.pg.groupName, participants: groupTable.pg.participants })
        .from(groupTable.pg)
        .where(inArray(groupTable.pg.id, groupIds));

      if (groups.length === 0) return null;

      // 6. Select group (use provided groupId or default to first)
      const selectedGroup = (input.groupId && groups.find((g) => g.id === input.groupId)) || groups[0]!;

      // 7. Get participant details
      const participantIds = selectedGroup.participants || [];
      if (participantIds.length === 0) {
        return {
          groups: groups.map((g) => ({ id: g.id, name: g.groupName || 'Unnamed group' })),
          selectedGroupId: selectedGroup.id,
          responses: {} as Record<string, Array<{ name: string, response: string }>>,
        };
      }

      const participants = await db.pg
        .select({ id: meetPersonTable.pg.id, name: meetPersonTable.pg.name, email: meetPersonTable.pg.email })
        .from(meetPersonTable.pg)
        .where(inArray(meetPersonTable.pg.id, participantIds));

      const participantEmails = participants.map((p) => p.email).filter(Boolean) as string[];
      if (participantEmails.length === 0) {
        return {
          groups: groups.map((g) => ({ id: g.id, name: g.groupName || 'Unnamed group' })),
          selectedGroupId: selectedGroup.id,
          responses: {} as Record<string, Array<{ name: string, response: string }>>,
        };
      }

      // 8. Get all exercise responses for these participants
      const emailToName = new Map(participants.map((p) => [p.email, p.name || 'Anonymous']));

      const exerciseResponses = await db.pg
        .select({
          exerciseId: exerciseResponseTable.pg.exerciseId,
          email: exerciseResponseTable.pg.email,
          response: exerciseResponseTable.pg.response,
        })
        .from(exerciseResponseTable.pg)
        .where(
          inArray(exerciseResponseTable.pg.email, participantEmails),
        );

      // 9. Group by exerciseId
      const responses: Record<string, Array<{ name: string, response: string }>> = {};
      for (const er of exerciseResponses) {
        if (!responses[er.exerciseId]) {
          responses[er.exerciseId] = [];
        }
        responses[er.exerciseId]!.push({
          name: emailToName.get(er.email) || 'Anonymous',
          response: er.response,
        });
      }

      return {
        groups: groups.map((g) => ({ id: g.id, name: g.groupName || 'Unnamed group' })),
        selectedGroupId: selectedGroup.id,
        responses,
      };
    }),
});
