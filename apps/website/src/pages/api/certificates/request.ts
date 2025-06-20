import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, courseRegistrationTable, exerciseTable, exerciseResponseTable, InferSelectModel,
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
      const courseRegistrations = await db.pg.select()
        .from(courseRegistrationTable.pg)
        .where(and(
          eq(courseRegistrationTable.pg.email, auth.email),
          eq(courseRegistrationTable.pg.courseId, body.courseId),
          eq(courseRegistrationTable.pg.decision, 'Accept'),
        ));

      const courseRegistration = courseRegistrations[0];

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
      const exercises = await db.pg.select()
        .from(exerciseTable.pg)
        .where(and(
          eq(exerciseTable.pg.courseIdRead, body.courseId),
          eq(exerciseTable.pg.status, 'Active'),
        ));

      if (exercises.length === 0) {
        throw new createHttpError.InternalServerError('No exercises found for this course');
      }

      // Get all exercise responses for this user
      const exerciseResponses = await db.pg.select()
        .from(exerciseResponseTable.pg)
        .where(eq(exerciseResponseTable.pg.email, auth.email));

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

      const updatedCourseRegistration = await db.airtableUpdate(courseRegistrationTable, {
        id: courseRegistration.id || '',
        certificateId: courseRegistration.id || '',
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
