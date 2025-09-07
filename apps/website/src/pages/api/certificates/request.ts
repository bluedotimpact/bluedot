import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  courseRegistrationTable, exerciseTable, exerciseResponseTable, InferSelectModel,
} from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';

type CourseRegistration = InferSelectModel<typeof courseRegistrationTable.pg>;

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
      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: auth.email,
          courseId: body.courseId,
          decision: 'Accept',
        },
      });

      if (!courseRegistration) {
        throw new createHttpError.NotFound('No course registration found');
      }

      if (courseRegistration.certificateId) {
        // Already created, nothing to do
        return {
          type: 'success' as const,
          courseRegistration,
        };
      }

      // Check if all exercises for this course have been completed
      const allExercises = await db.scan(exerciseTable, { courseIdRead: body.courseId, status: 'Active' });

      if (allExercises.length === 0) {
        throw new createHttpError.InternalServerError('No exercises found for this course');
      }

      // Get all exercise responses for this user
      const exerciseResponses = await db.scan(exerciseResponseTable, { email: auth.email });

      // Check if all exercises have been completed
      const incompleteExercises = allExercises.filter((exercise) => {
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
