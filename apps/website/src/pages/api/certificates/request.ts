import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula } from 'airtable-ts-formula';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import {
  CourseRegistration,
  courseRegistrationTable,
  Exercise,
  exerciseTable,
  ExerciseResponse,
  exerciseResponseTable,
} from '../../../lib/api/db/tables';

export type RequestCertificateResponse = {
  type: 'success'
  courseRegistration: CourseRegistration;
};

export type RequestCertificateRequest = {
  courseId: string;
};

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    courseId: z.string(),
  }),
  responseBody: z.object({
    type: z.literal('success'),
    courseRegistration: z.any(),
  }),
}, async (body, { auth, raw }) => {
  switch (raw.req.method) {
    case 'POST': {
      const courseRegistration = (await db.scan(courseRegistrationTable, {
        filterByFormula: formula(await db.table(courseRegistrationTable), [
          'AND',
          ['=', { field: 'email' }, auth.email],
          ['=', { field: 'courseId' }, body.courseId],
          ['=', { field: 'decision' }, 'Accept'],
        ]),
      }))[0];

      if (!courseRegistration) {
        throw new createHttpError.NotFound('Course registration not found');
      }

      if (courseRegistration.certificateId) {
        // Already created, nothing to do
        return {
          type: 'success' as const,
          courseRegistration,
        };
      }

      // Check if all exercises for this course have been completed
      const exercises: Exercise[] = await db.scan(exerciseTable, {
        filterByFormula: formula(await db.table(exerciseTable), [
          'AND',
          ['=', { field: 'courseId' }, body.courseId],
          ['=', { field: 'status' }, 'Active'],
        ]),
      });

      if (exercises.length === 0) {
        throw new createHttpError.InternalServerError('No exercises found for this course');
      }

      // Get all exercise responses for this user
      const exerciseResponses: ExerciseResponse[] = await db.scan(exerciseResponseTable, {
        filterByFormula: formula(await db.table(exerciseResponseTable), [
          '=',
          { field: 'email' },
          auth.email,
        ]),
      });

      // Check if all exercises have been completed
      const incompleteExercises = exercises.filter((exercise) => {
        const response = exerciseResponses.find((resp) => resp.exerciseId === exercise.id);
        return !response || !response.completed;
      }).sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

      if (incompleteExercises.length > 0) {
        throw new createHttpError.BadRequest(`You have ${incompleteExercises.length} incomplete exercises:
${incompleteExercises.map((e) => `- Unit ${e.unitNumber}: ${e.title}`).join('\n')}
Please complete all exercises before requesting a certificate.`);
      }

      const updatedCourseRegistration = await db.update(courseRegistrationTable, {
        id: courseRegistration.id,
        certificateId: courseRegistration.id,
        certificateCreatedAt: Math.floor(Date.now() / 1000),
      });

      return {
        type: 'success' as const,
        courseRegistration: updatedCourseRegistration,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
