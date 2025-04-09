import { z } from 'zod';
import db from '../../../../lib/api/db';
import { makeApiRoute } from '../../../../lib/api/makeApiRoute';
import {
  Exercise,
  exerciseResponseTable,
  exerciseTable,
} from '../../../../lib/api/db/tables';
import createHttpError from 'http-errors';

export type GetExerciseResponse = {
  type: 'success',
  exercise: Exercise,
};

export default makeApiRoute({
  requireAuth: false,
  requestBody: z.optional(
    z.object({
      response: z.string(),
    })
  ),
  responseBody: z.optional(
    z.object({
    type: z.literal('success'),
      exercise: z.any(),
    }),
  ),
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

      // If the exercise response doesn't exist, create it
      if (!exerciseResponse) {
        await db.insert(exerciseResponseTable, {
          response: body.response,
        });
      } else {
        // If the exercise response does exist, update it
        await db.update(exerciseResponseTable, {
          id: exerciseResponse.id,
          response: body.response,
        });
      }
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
