import { courseRegistrationTable, exerciseResponseTable, exerciseTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const certificatesRouter = router({
  requestCertificate: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          courseId: input.courseId,
          decision: 'Accept',
        },
      });

      if (!courseRegistration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'No course registration found' });
      }

      if (courseRegistration.certificateId) {
        // Already created, nothing to do
        return { courseRegistration };
      }

      // Check if all exercises for this course have been completed
      const allExercises = await db.scan(exerciseTable, { courseIdRead: input.courseId, status: 'Active' });

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
