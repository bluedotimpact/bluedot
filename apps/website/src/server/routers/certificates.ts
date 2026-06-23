import {
  and,
  COURSE_ROLE,
  courseRegistrationTable,
  courseTable,
  eq,
  exerciseResponsePgTable,
  exerciseTable,
  inArray,
  meetPersonTable,
  roundTable,
  selfServeCourseRegistrationTable,
} from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import { timingSafeEqual } from 'crypto';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { FOAI_COURSE_ID, ONE_DAY_MS } from '../../lib/constants';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import type { AppRouter } from './_app';
import { hasUpcomingRoundsForCourseId } from './course-rounds';

async function areAllFoaiExercisesComplete(email: string): Promise<boolean> {
  const activeExercises = await db.scan(exerciseTable, { courseId: FOAI_COURSE_ID, status: 'Active' });
  const requiredExercises = activeExercises.filter((exercise) => !exercise.isOptional);
  if (requiredExercises.length === 0) {
    return false;
  }

  // Scope the response scan to FoAI exercises so we don't pull every response this user has ever
  // submitted (across all courses) just to check FoAI completion.
  const exerciseResponses = await db.pg
    .select()
    .from(exerciseResponsePgTable)
    .where(and(
      eq(exerciseResponsePgTable.email, email),
      inArray(exerciseResponsePgTable.exerciseId, requiredExercises.map((e) => e.id)),
    ));

  const completedExerciseIds = new Set(exerciseResponses
    .filter((resp) => resp.completedAt != null)
    .map((resp) => resp.exerciseId));
  return requiredExercises.every((exercise) => completedExerciseIds.has(exercise.id));
}

export async function issueFoaiCertificateIfComplete(email: string): Promise<boolean> {
  const selfServeRegistration = await db.getFirst(selfServeCourseRegistrationTable, {
    filter: { email, courseId: FOAI_COURSE_ID },
    sortBy: 'createdAt',
  });

  if (!selfServeRegistration || selfServeRegistration.certificateId) {
    return false;
  }

  if (!(await areAllFoaiExercisesComplete(email))) {
    return false;
  }

  const certificateCreatedAt = Math.floor(Date.now() / 1000);
  const certificateId = selfServeRegistration.id;

  await db.update(selfServeCourseRegistrationTable, { id: selfServeRegistration.id, certificateId, certificateCreatedAt });

  return true;
}

export type CertificateData = inferRouterOutputs<AppRouter>['certificates']['getStatus'];

export async function getCertificateData(certificateId: string) {
  const selfServeRegistration = await db.getFirst(selfServeCourseRegistrationTable, { filter: { certificateId }, sortBy: 'createdAt' });
  const facilitatedRegistration = await db.getFirst(courseRegistrationTable, { filter: { certificateId } });

  const registration = selfServeRegistration ?? facilitatedRegistration;

  if (!registration) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Certificate not found' });
  }

  const course = await db.get(courseTable, { id: registration.courseId });

  return {
    certificateId,
    certificateCreatedAt: registration.certificateCreatedAt ?? Math.floor(Date.now() / 1000),
    recipientName: registration.fullName ?? '',
    courseName: course.title,
    courseSlug: course.slug,
    courseDetailsUrl: course.detailsUrl ?? '',
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    certificationDescription: course.certificationDescription || '',
  };
}

export const certificatesRouter = router({
  // This is a public procedure because it's called from an Airtable script, not from within the app
  createFacilitatedCourseCertificate: publicProcedure
    .input(z.object({ courseRegistrationId: z.string(), publicToken: z.string().min(1) }))
    .mutation(async ({ input: { courseRegistrationId, publicToken } }) => {
      // Authenticated by a shared secret rather than a user session. Allows certificate creation
      // even when not all exercises are complete, for the admin/Airtable issuance flow.
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

      // Facilitated courses only — FoAI certificates are issued automatically on completion, not here
      if (courseRegistration.courseId === FOAI_COURSE_ID) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'This endpoint does not issue Future of AI certificates' });
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
      const selfServeRegistration = await db.getFirst(selfServeCourseRegistrationTable, { filter: { certificateId }, sortBy: 'createdAt' });
      const facilitatedRegistration = await db.getFirst(courseRegistrationTable, { filter: { certificateId } });

      const registration = selfServeRegistration ?? facilitatedRegistration;

      const isOwner = registration?.email?.toLowerCase() === ctx.auth.email.toLowerCase();
      return { isOwner };
    }),

  getStatus: publicProcedure.input(z.object({ courseId: z.string() })).query(async ({ ctx, input: { courseId } }) => {
    if (!ctx.auth) {
      const hasUpcomingRounds = await hasUpcomingRoundsForCourseId(courseId);
      return { status: 'not-authenticated', hasUpcomingRounds } as const;
    }

    // Future of AI is self-serve: it lives in its own table and never has rounds.
    if (courseId === FOAI_COURSE_ID) {
      const selfServeRegistration = await db.getFirst(selfServeCourseRegistrationTable, {
        filter: { email: ctx.auth.email, courseId },
        sortBy: 'createdAt',
      });

      if (!selfServeRegistration) {
        return { status: 'not-enrolled', hasUpcomingRounds: false } as const;
      }

      if (selfServeRegistration.certificateId) {
        const certificate = await getCertificateData(selfServeRegistration.certificateId);
        return {
          status: 'has-certificate' as const,
          ...certificate,
        };
      }

      // FoAI auto-issues certificates when every active exercise is completed (see saveExerciseResponse).
      return { status: 'exercises-incomplete' } as const;
    }

    const courseRegistration = await db.getFirst(courseRegistrationTable, {
      filter: { email: ctx.auth.email, courseId, decision: 'Accept' },
    });

    if (!courseRegistration) {
      const hasUpcomingRounds = await hasUpcomingRoundsForCourseId(courseId);
      return { status: 'not-enrolled', hasUpcomingRounds } as const;
    }

    if (courseRegistration.certificateId) {
      const certificate = await getCertificateData(courseRegistration.certificateId);
      return {
        status: 'has-certificate' as const,
        ...certificate,
      };
    }

    const meetPerson = await db.getFirst(meetPersonTable, {
      filter: { applicationsBaseRecordId: courseRegistration.id },
    });

    if (!meetPerson) {
      const hasUpcomingRounds = await hasUpcomingRoundsForCourseId(courseId);
      return { status: 'not-eligible', hasUpcomingRounds } as const;
    }

    if (meetPerson.role === COURSE_ROLE.PARTICIPANT) {
      const { uniqueDiscussionAttendance, numUnits } = meetPerson;
      const hasAttendedEnough
        = uniqueDiscussionAttendance == null
          || numUnits == null
          || numUnits === 0
          || numUnits - uniqueDiscussionAttendance <= 1;

      const round = meetPerson.round
        ? await db.getFirst(roundTable, { filter: { id: meetPerson.round }, sortBy: 'lastDiscussionDate' })
        : null;
      const sevenDaysFromNow = Date.now() + 7 * ONE_DAY_MS;
      const isLastDiscussionSoonOrPassed
        = round?.lastDiscussionDate != null
          && new Date(round.lastDiscussionDate).getTime() <= sevenDaysFromNow;

      if (!hasAttendedEnough) {
        return {
          status: 'attendance-ineligible' as const,
          uniqueDiscussionAttendance,
          numUnits,
          isLastDiscussionSoonOrPassed,
        };
      }

      return {
        status: 'action-plan-pending',
        meetPersonId: meetPerson.id,
        hasSubmittedActionPlan: (meetPerson.projectSubmission?.length ?? 0) > 0,
        isLastDiscussionSoonOrPassed,
      } as const;
    }

    if (meetPerson.role === COURSE_ROLE.FACILITATOR) {
      return { status: 'is-facilitator' } as const;
    }

    const hasUpcomingRounds = await hasUpcomingRoundsForCourseId(courseId);
    return { status: 'not-eligible', hasUpcomingRounds } as const;
  }),
});
