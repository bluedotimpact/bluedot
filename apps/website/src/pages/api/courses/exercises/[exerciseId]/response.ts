import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, exerciseResponseTable, InferSelectModel,
} from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type ExerciseResponse = InferSelectModel<typeof exerciseResponseTable.pg>;

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

  if (!auth.email || typeof exerciseId !== 'string') {
    throw new createHttpError.BadRequest();
  }

  const exerciseResponses = await db.pg.select()
    .from(exerciseResponseTable.pg)
    .where(and(
      eq(exerciseResponseTable.pg.exerciseId, exerciseId),
      eq(exerciseResponseTable.pg.email, auth.email),
    ));

  const exerciseResponse = exerciseResponses[0];

  switch (raw.req.method) {
    // Get exercise response
    case 'GET': {
      if (!exerciseResponse) {
        throw new createHttpError.NotFound('Exercise response not found');
      }

      return {
        type: 'success' as const,
        exerciseResponse: exerciseResponse ? {
          ...exerciseResponse,
          // For some reason Airtable often adds a newline to the end of the response
          response: exerciseResponse.response?.trimEnd() || '',
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
        updatedExerciseResponse = await db.airtableUpdate(exerciseResponseTable, {
          id: exerciseResponse.id || '',
          exerciseId,
          response: body.response,
          completed: body.completed ?? false,
        });
      } else {
        // If the exercise response does NOT exist, create it
        updatedExerciseResponse = await db.airtableInsert(exerciseResponseTable, {
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
