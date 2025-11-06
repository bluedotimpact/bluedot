import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  exerciseResponseTable, ExerciseResponse,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

export type GetExerciseResponseResponse = {
  type: 'success',
  exerciseResponse?: ExerciseResponse,
};

export type PutExerciseResponseRequest = {
  response: string,
  completed?: boolean,
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.optional(
    z.object({
      response: z.string(),
      completed: z.boolean().optional(),
    }),
  ),
  responseBody: z.object({
    type: z.literal('success'),
    exerciseResponse: z.any().optional(),
  }),
}, async (body, { raw, auth }) => {
  const { exerciseId } = raw.req.query;

  if (typeof exerciseId !== 'string') {
    throw new createHttpError.BadRequest('Invalid exercise ID');
  }

  let exerciseResponse: ExerciseResponse | null = null;
  try {
    exerciseResponse = await db.getFirst(exerciseResponseTable, {
      filter: { exerciseId, email: auth.email },
    });
  } catch (error) {
    throw new createHttpError.InternalServerError(
      process.env.NODE_ENV === 'production'
        ? 'Database error occurred'
        : `Database error occurred: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  switch (raw.req.method) {
    // Get exercise response
    case 'GET': {
      return {
        type: 'success' as const,
        exerciseResponse: exerciseResponse ? {
          ...exerciseResponse,
          // Preserve trailing whitespace and line feeds as entered by the user
          response: exerciseResponse.response,
        } : undefined,
      };
    }

    // Upsert exercise response
    case 'PUT': {
      if (!body) {
        throw new createHttpError.BadRequest('PUT requests require a body');
      }

      let updatedExerciseResponse;

      // If the exercise response does exist, update it
      if (exerciseResponse) {
        updatedExerciseResponse = await db.update(exerciseResponseTable, {
          id: exerciseResponse.id,
          exerciseId,
          response: body.response,
          completed: body.completed ?? false,
        });
      } else {
        // If the exercise response does NOT exist, create it
        updatedExerciseResponse = await db.insert(exerciseResponseTable, {
          email: auth.email,
          exerciseId,
          response: body.response,
          completed: body.completed ?? false,
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
