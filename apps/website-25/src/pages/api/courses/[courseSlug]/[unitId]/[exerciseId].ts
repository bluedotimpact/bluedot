import { z } from 'zod';
import db from '../../../../../lib/api/db';
import { makeApiRoute } from '../../../../../lib/api/makeApiRoute';
import {
  Exercise,
  exerciseTable,
} from '../../../../../lib/api/db/tables';

export type GetExerciseResponse = {
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
  const { courseSlug, unitId, exerciseId } = raw.req.query;

  const exercise = (await db.scan(exerciseTable, {
    filterByFormula: `AND({[>] Course slug} = "${courseSlug}", {[>] Unit number} = ${unitId}, {[*] Record ID} = "${exerciseId}")`,
  }))[0];

  return {
    type: 'success' as const,
    exercise,
  };
});
