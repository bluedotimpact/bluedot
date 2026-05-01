import {
  courseRegistrationTable, exerciseResponseTable, exerciseTable, meetPersonTable,
} from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import { timingSafeEqual } from 'crypto';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { getCertificateData } from '../../pages/certification';
import { FOAI_COURSE_ID } from '../../lib/constants';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import type { AppRouter } from './_app';

export type CertificateStatus = inferRouterOutputs<AppRouter>['certificates']['getStatus']['status'];

export const certificatesRouter = router({
  // This is a public procedure because it's called from an Airtable script, not from within the app
  create: publicProcedure
    .input(z.object({ courseRegistrationId: z.string(), publicToken: z.string().min(1) }))
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
          message:
            'Self-requesting certificates is only available for the Future of AI course. For other courses, certificates are issued after completing your facilitated cohort.',
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
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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

  getStatus: publicProcedure.input(z.object({ courseId: z.string() })).query(async ({ ctx, input: { courseId } }) => {
    // For non-logged in users
    if (!ctx.auth) {
      return { status: 'not-eligible' } as const;
    }

    const courseRegistration = await db.getFirst(courseRegistrationTable, {
      filter: { email: ctx.auth.email, courseId, decision: 'Accept' },
    });

    if (!courseRegistration) {
      return { status: 'not-eligible' } as const;
    }

    if (courseRegistration.certificateId) {
      const certificate = await getCertificateData(courseRegistration.certificateId, courseRegistration);
      return {
        status: 'has-certificate' as const,
        ...certificate,
      };
    }

    if (courseRegistration.courseId === FOAI_COURSE_ID) {
      // FOAI -> self-service certificates, users must request a certificate which runs a generation mutation
      return { status: 'can-request' } as const;
    }

    const meetPerson = await db.getFirst(meetPersonTable, {
      filter: { applicationsBaseRecordId: courseRegistration.id },
    });

    if (!meetPerson) {
      return { status: 'not-eligible' } as const;
    }

    if (meetPerson.role === 'Participant') {
      const { uniqueDiscussionAttendance, numUnits } = meetPerson;
      const hasAttendedEnough = uniqueDiscussionAttendance == null
        || numUnits == null
        || numUnits === 0
        || (numUnits - uniqueDiscussionAttendance) <= 1;

      if (!hasAttendedEnough) {
        return {
          status: 'attendance-ineligible' as const,
          uniqueDiscussionAttendance,
          numUnits,
        };
      }

      return {
        status: 'action-plan-pending',
        meetPersonId: meetPerson.id,
        hasSubmittedActionPlan: (meetPerson.projectSubmission?.length ?? 0) > 0,
      } as const;
    }

    if (meetPerson.role === 'Facilitator') {
      return { status: 'facilitator-pending' } as const;
    }

    return { status: 'not-eligible' } as const;
  }),
});
