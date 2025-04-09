import { z } from 'zod';
import createHttpError from 'http-errors';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import {
  Exercise,
  ExerciseResponse,
  exerciseResponseTable,
  exerciseTable,
} from '../../../../lib/api/db/tables';

export type GetExerciseResponse = {
  type: 'success',
  exercise: Exercise,
};

export type PutExerciseResponse = {
  type: 'success',
  exerciseResponse: ExerciseResponse,
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.optional(
    z.object({
      response: z.string(),
    }),
  ),
  responseBody: z.object({
    type: z.literal('success'),
    exercise: z.any().optional(),
    exerciseResponse: z.any().optional(),
  }),
}, async (body, { raw }) => {
  const { exerciseId } = raw.req.query;

  switch (raw.req.method) {
    // Get exercise
    case 'GET': {
      const exercise = (await db.scan(exerciseTable, {
        filterByFormula: `{[*] Record ID} = "${exerciseId}"`,
      }))[0];

      return {
        type: 'success' as const,
        exercise,
      };
    }

    // Upsert exercise response
    case 'PUT': {
      if (!body) {
        throw new createHttpError.BadRequest('Expected PUT request to include payload');
      }
      const exerciseResponse = (await db.scan(exerciseResponseTable, {
        filterByFormula: `{[>] Exercise record ID} = "${exerciseId}"`,
      }))[0];

      let updatedExerciseResponse;

      // If the exercise response doesn't exist, create it
      if (!exerciseResponse) {
        updatedExerciseResponse = await db.insert(exerciseResponseTable, {
          response: body.response,
        });
      } else {
        // If the exercise response does exist, update it
        updatedExerciseResponse = await db.update(exerciseResponseTable, {
          id: exerciseResponse.id,
          response: body.response,
        });
      }

      return {
        type: 'success' as const,
        exerciseResponse: updatedExerciseResponse,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
