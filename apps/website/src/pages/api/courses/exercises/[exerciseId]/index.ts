import { z } from 'zod';
import createHttpError from 'http-errors';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import {
  Exercise,
  exerciseTable,
} from '../../../../../lib/api/db/tables';

export type GetExercise = {
  type: 'success',
  exercise: Exercise,
};

export default makeApiRoute({
  requireAuth: false,
  responseBody: z.object({
    type: z.literal('success'),
    exercise: z.any(),
  }),
}, async (body, { raw }) => {
  const { exerciseId } = raw.req.query;
  if (typeof exerciseId !== 'string') {
    throw new createHttpError.BadRequest('Invalid exercise ID');
  }

  switch (raw.req.method) {
    case 'GET': {
      const exercise = await db.get(exerciseTable, exerciseId);

      return {
        type: 'success' as const,
        exercise,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
