import { z } from 'zod';
import { exerciseTable, exerciseResponseTable } from '@bluedot/db';
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
          completedAt: completedAt ?? exerciseResponse.completedAt,
        });
      }

      return db.insert(exerciseResponseTable, {
        email: ctx.auth.email,
        exerciseId: input.exerciseId,
        response: input.response,
        completedAt: completedAt ?? null,
      });
    }),
});
