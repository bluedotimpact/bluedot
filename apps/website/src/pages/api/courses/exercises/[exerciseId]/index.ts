import { z } from 'zod';
import createHttpError from 'http-errors';
import { exerciseTable, InferSelectModel } from '@bluedot/db';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';

type Exercise = InferSelectModel<typeof exerciseTable.pg>;

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
      const exercise = await db.get(exerciseTable, { id: exerciseId });

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
