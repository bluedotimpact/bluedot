import { courseRegistrationTable, exerciseResponseTable, exerciseTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import {
  checkAdminAccess, protectedProcedure, publicProcedure, router,
} from '../trpc';
import env from '../../lib/api/env';

export const certificatesRouter = router({
  // This is a public procedure because it's called from an Airtable script, not from within the app
  create: publicProcedure
    .input(z.object({ email: z.string().email(), courseRegistrationId: z.string(), token: z.string() }))
    .mutation(async ({ input: { email, courseRegistrationId, token } }) => {
      // This is similar to the `request` procedure below, but it does not rely on authentication and allows a
      // certificate to be created even if not all exercises are complete.
      if (!env.CERTIFICATE_CREATION_TOKEN || token !== env.CERTIFICATE_CREATION_TOKEN) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid token' });
      }

      const hasAdminAccess = await checkAdminAccess(email);
      if (!hasAdminAccess) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Forbidden' });
      }

      const courseRegistration = await db.get(courseRegistrationTable, {
        id: courseRegistrationId,
      });

      if (!courseRegistration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course registration not found' });
      }

      const now = Math.floor(Date.now() / 1000);

      if (courseRegistration.certificateId) {
        // Already created, nothing to do
        return {
          certificateId: courseRegistration.certificateId,
          certificateCreatedAt: courseRegistration.certificateCreatedAt ?? now,
        };
      }

      // Create certificate
      const updatedCourseRegistration = await db.update(courseRegistrationTable, {
        id: courseRegistrationId,
        certificateId: courseRegistrationId,
        certificateCreatedAt: now,
      });

      return {
        certificateId: updatedCourseRegistration.certificateId!,
        certificateCreatedAt: updatedCourseRegistration.certificateCreatedAt ?? now,
      };
    }),

  request: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input: courseId }) => {
      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          courseId,
          decision: 'Accept',
        },
      });

      if (!courseRegistration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No course registration found' });
      }

      if (courseRegistration.certificateId) {
        // Already created, nothing to do
        return courseRegistration;
      }

      // Check if all exercises for this course have been completed
      const allExercises = await db.scan(exerciseTable, { courseIdRead: courseId, status: 'Active' });

      if (allExercises.length === 0) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'No exercises found for this course' });
      }

      // Get all exercise responses for this user
      const exerciseResponses = await db.scan(exerciseResponseTable, { email: ctx.auth.email });

      // Check if all exercises have been completed
      const incompleteExercises = allExercises
        .filter((exercise) => {
          const response = exerciseResponses.find((resp) => resp.exerciseId === exercise.id);
          return !response || !response.completed;
        })
        .sort((a, b) => Number(a.unitNumber) - Number(b.unitNumber));

      if (incompleteExercises.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `You have ${incompleteExercises.length} incomplete exercises:
${incompleteExercises.map((e) => `- Unit ${e.unitNumber}: ${e.title}`).join('\n')}
Please complete all exercises before requesting a certificate.`,
        });
      }

      return db.update(courseRegistrationTable, {
        id: courseRegistration.id,
        certificateId: courseRegistration.id,
        certificateCreatedAt: Math.floor(Date.now() / 1000),
      });
    }),
});
