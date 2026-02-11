import { courseRegistrationTable, exerciseResponseTable, exerciseTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import { timingSafeEqual } from 'crypto';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import { FOAI_COURSE_ID } from '../../lib/constants';

export const certificatesRouter = router({
  // This is a public procedure because it's called from an Airtable script, not from within the app
  create: publicProcedure
    .input(z.object({ courseRegistrationId: z.string(), publicToken: z.string() }))
    .mutation(async ({ input: { courseRegistrationId, publicToken } }) => {
      // This is similar to the `request` procedure below, but it relies on a shared secret for authentication and
      // allows a certificate to be created even if not all exercises are complete.
      if (!env.CERTIFICATE_CREATION_TOKEN) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Certificate creation not configured' });
      }

      const tokenBuf = Buffer.from(publicToken);
      const secretBuf = Buffer.from(env.CERTIFICATE_CREATION_TOKEN);
      if (tokenBuf.length !== secretBuf.length || !timingSafeEqual(tokenBuf, secretBuf)) {
        throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Invalid token' });
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

  verifyOwnership: protectedProcedure
    .input(z.object({ certificateId: z.string() }))
    .query(async ({ ctx, input: { certificateId } }) => {
      const registration = await db.get(courseRegistrationTable, { certificateId });
      const isOwner = registration?.email.toLowerCase() === ctx.auth.email.toLowerCase();
      return { isOwner };
    }),

  request: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .mutation(async ({ ctx, input: { courseId } }) => {
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

      // Only FOAI course allows self-requesting certificates
      // Non-FOAI courses require certificates to be issued via the `create` procedure (admin process)
      if (courseRegistration.courseId !== FOAI_COURSE_ID) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Self-requesting certificates is only available for the Future of AI course. For other courses, certificates are issued after completing your facilitated cohort.',
        });
      }

      // Check if all exercises for this course have been completed
      const allExercises = await db.scan(exerciseTable, { courseId, status: 'Active' });

      if (allExercises.length === 0) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'No exercises found for this course' });
      }

      // Get all exercise responses for this user
      const exerciseResponses = await db.scan(exerciseResponseTable, { email: ctx.auth.email });

      // Check if all exercises have been completed
      const incompleteExercises = allExercises
        .filter((exercise) => {
          // Workaround for duplicate exercise responses
          const hasCompletedResponse = exerciseResponses.some((resp) => resp.exerciseId === exercise.id && resp.completedAt != null);
          return !hasCompletedResponse;
        })
        .sort((a, b) => Number(a.exerciseNumber || Infinity) - Number(b.exerciseNumber || Infinity));

      if (incompleteExercises.length > 0) {
        const exerciseList = incompleteExercises
          .map((e) => {
            return `- ${e.title}`;
          })
          .join('\n');

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `You have ${incompleteExercises.length} incomplete exercises:
${exerciseList}
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
