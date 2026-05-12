import {
  courseRegistrationTable,
  courseTable,
  exerciseResponseTable,
  exerciseTable,
  meetPersonTable,
  roundTable,
  type CourseRegistration,
} from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import { timingSafeEqual } from 'crypto';
import z from 'zod';
import db from '../../lib/api/db';
import env from '../../lib/api/env';
import { FOAI_COURSE_ID, ONE_DAY_MS } from '../../lib/constants';
import { protectedProcedure, publicProcedure, router } from '../trpc';
import type { AppRouter } from './_app';

async function areAllFoaiExercisesComplete(email: string): Promise<boolean> {
  const [allExercises, exerciseResponses] = await Promise.all([
    db.scan(exerciseTable, { courseId: FOAI_COURSE_ID, status: 'Active' }),
    db.scan(exerciseResponseTable, { email }),
  ]);
  if (allExercises.length === 0) {
    return false;
  }

  const completedExerciseIds = new Set(
    exerciseResponses
      .filter((resp) => resp.completedAt != null)
      .map((resp) => resp.exerciseId),
  );
  return allExercises.every((exercise) => completedExerciseIds.has(exercise.id));
}

export async function issueFoaiCertificateIfComplete(email: string): Promise<boolean> {
  const courseRegistration = await db.getFirst(courseRegistrationTable, {
    filter: { email, courseId: FOAI_COURSE_ID, decision: 'Accept' },
  });

  if (!courseRegistration || courseRegistration.certificateId) {
    return false;
  }

  if (!(await areAllFoaiExercisesComplete(email))) {
    return false;
  }

  await db.update(courseRegistrationTable, {
    id: courseRegistration.id,
    certificateId: courseRegistration.id,
    certificateCreatedAt: Math.floor(Date.now() / 1000),
  });
  return true;
}

export type CertificateData = inferRouterOutputs<AppRouter>['certificates']['getStatus'];

export async function getCertificateData(certificateId: string, existingCourseRegistration?: CourseRegistration) {
  const courseRegistration = existingCourseRegistration ?? (await db.get(courseRegistrationTable, { certificateId }));
  const course = await db.get(courseTable, { id: courseRegistration.courseId });

  return {
    certificateId,
    certificateCreatedAt: courseRegistration.certificateCreatedAt ?? Math.floor(Date.now() / 1000),
    recipientName: courseRegistration.fullName ?? '',
    courseName: course.title,
    courseSlug: course.slug,
    courseDetailsUrl: course.detailsUrl ?? '',
    // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
    certificationDescription: course.certificationDescription || '',
  };
}

export const certificatesRouter = router({
  // This is a public procedure because it's called from an Airtable script, not from within the app
  create: publicProcedure
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

  getStatus: publicProcedure.input(z.object({ courseId: z.string() })).query(async ({ ctx, input: { courseId } }) => {
    if (!ctx.auth) {
      return { status: 'not-authenticated' } as const;
    }

    const courseRegistration = await db.getFirst(courseRegistrationTable, {
      filter: { email: ctx.auth.email, courseId, decision: 'Accept' },
    });

    if (!courseRegistration) {
      return { status: 'not-enrolled' } as const;
    }

    if (courseRegistration.certificateId) {
      const certificate = await getCertificateData(courseRegistration.certificateId, courseRegistration);
      return {
        status: 'has-certificate' as const,
        ...certificate,
      };
    }

    if (courseRegistration.courseId === FOAI_COURSE_ID) {
      // FOAI auto-issues certificates when every active exercise is completed (see saveExerciseResponse).
      // Reaching this branch means the learner is enrolled but hasn't finished all exercises yet.
      return { status: 'exercises-incomplete' } as const;
    }

    const meetPerson = await db.getFirst(meetPersonTable, {
      filter: { applicationsBaseRecordId: courseRegistration.id },
    });

    if (!meetPerson) {
      return { status: 'not-eligible' } as const;
    }

    if (meetPerson.role === 'Participant') {
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

    if (meetPerson.role === 'Facilitator') {
      return { status: 'is-facilitator' } as const;
    }

    return { status: 'not-eligible' } as const;
  }),
});
