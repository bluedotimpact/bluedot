import createHttpError from 'http-errors';
import { z } from 'zod';
import { makeApiRoute } from '../../lib/api/makeApiRoute';
import { undoMoveToCourse } from '../../lib/api/airtable';
import { moveFromCourse } from '../../lib/client/courseMoves';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    applicationId: z.string(),
    // The round being reviewed, whose course the application is restored to.
    roundId: z.string(),
    restoreCourse: z.enum(['Technical AI Safety', 'Technical AI Safety Project']),
  }),
}, async ({ applicationId, roundId, restoreCourse }) => {
  const move = moveFromCourse(restoreCourse);
  if (!move) throw new createHttpError.BadRequest(`No course move starts from ${restoreCourse}`);
  await undoMoveToCourse(applicationId, roundId, move.targetCourse, restoreCourse);
});
