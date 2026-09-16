import {
  and,
  arrayContains,
  COURSE_ROLE,
  courseRegistrationTable,
  courseTable,
  desc,
  eq,
  exerciseResponsePgTable,
  exerciseTable,
  groupDiscussionTable,
  inArray,
  meetPersonTable,
  roundTable,
  selfServeCourseRegistrationTable,
} from '@bluedot/db';
import { TRPCError, type inferRouterOutputs } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { verifyPublicToken } from '../../lib/api/utils';
import { FOAI_COURSE_ID, ONE_DAY_MS } from '../../lib/constants';
import {
  getUserFromAuthOrThrow, protectedProcedure, publicProcedure, router,
} from '../trpc';
import type { AppRouter } from './_app';
import { hasUpcomingRoundsForCourseId } from './course-rounds';

async function areAllFoaiExercisesComplete(userId: string): Promise<boolean> {
  const requiredExercises = await db.pg
    .select({ id: exerciseTable.pg.id, type: exerciseTable.pg.type })
    .from(exerciseTable.pg)
    .where(and(
      eq(exerciseTable.pg.courseId, FOAI_COURSE_ID),
      eq(exerciseTable.pg.status, 'Core'),
    ));
  if (requiredExercises.length === 0) {
    return false;
  }

  // Scope the response scan to FoAI exercises so we don't pull every response this user has ever
  // submitted (across all courses) just to check FoAI completion. Concurrent autosaves can leave
  // duplicate rows per exercise, so take only the latest row per exercise — the one
  // getExerciseResponse shows the learner.
  const latestResponses = await db.pg
    .selectDistinctOn([exerciseResponsePgTable.pg.exerciseId])
    .from(exerciseResponsePgTable.pg)
    .where(and(
      arrayContains(exerciseResponsePgTable.pg.userId, [userId]),
      inArray(
        exerciseResponsePgTable.pg.exerciseId,
        requiredExercises.map((e) => e.id),
      ),
    ))
    .orderBy(exerciseResponsePgTable.pg.exerciseId, desc(exerciseResponsePgTable.pg.createdAt));

  const responseByExerciseId = new Map(latestResponses.map((resp) => [resp.exerciseId, resp]));

  // Free-text answers autosave with completedAt null unless the learner clicks "Complete", so a
  // typed answer counts for the certificate even without the explicit click.
  return requiredExercises.every((exercise) => {
    const resp = responseByExerciseId.get(exercise.id);
    return (
      resp != null && (resp.completedAt != null || (exercise.type === 'Free text' && resp.response.trim().length > 0))
    );
  });
}

export async function issueFoaiCertificateIfComplete(userId: string): Promise<boolean> {
  const selfServeRegistration = await db.getFirst(selfServeCourseRegistrationTable, {
    filter: { userId, courseId: FOAI_COURSE_ID },
    sortBy: 'createdAt',
  });

  if (!selfServeRegistration || selfServeRegistration.certificateId) {
    return false;
  }

  if (!(await areAllFoaiExercisesComplete(userId))) {
    return false;
  }

  const certificateCreatedAt = Math.floor(Date.now() / 1000);
  const certificateId = selfServeRegistration.id;

  await db.update(selfServeCourseRegistrationTable, {
    id: selfServeRegistration.id,
    certificateId,
    certificateCreatedAt,
  });

  return true;
}

export type CertificateData = inferRouterOutputs<AppRouter>['certificates']['getStatus'];

export async function getCertificateData(certificateId: string) {
  const selfServeRegistration = await db.getFirst(selfServeCourseRegistrationTable, {
    filter: { certificateId },
    sortBy: 'createdAt',
  });
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
      verifyPublicToken(publicToken);

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
      const user = await getUserFromAuthOrThrow(ctx.auth);

      const selfServeRegistration = await db.getFirst(selfServeCourseRegistrationTable, {
        filter: { certificateId },
        sortBy: 'createdAt',
      });
      const facilitatedRegistration = await db.getFirst(courseRegistrationTable, { filter: { certificateId } });

      const registration = selfServeRegistration ?? facilitatedRegistration;

      const isOwner = registration?.userId === user.id;
      return { isOwner };
    }),

  getStatus: publicProcedure.input(z.object({ courseId: z.string() })).query(async ({ ctx, input: { courseId } }) => {
    if (!ctx.auth) {
      const hasUpcomingRounds = await hasUpcomingRoundsForCourseId(courseId);
      return { status: 'not-authenticated', hasUpcomingRounds } as const;
    }

    const user = await getUserFromAuthOrThrow(ctx.auth);

    // Future of AI is self-serve: it lives in its own table and never has rounds.
    if (courseId === FOAI_COURSE_ID) {
      const selfServeRegistration = await db.getFirst(selfServeCourseRegistrationTable, {
        filter: { userId: user.id, courseId },
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
      filter: { userId: user.id, courseId, decision: 'Accept' },
    });

    if (!courseRegistration) {
      const hasUpcomingRounds = await hasUpcomingRoundsForCourseId(courseId);
      return { status: 'not-enrolled', hasUpcomingRounds } as const;
    }

    const meetPerson = await db.getFirst(meetPersonTable, {
      filter: { applicationsBaseRecordId: courseRegistration.id },
    });

    if (courseRegistration.certificateId) {
      const certificate = await getCertificateData(courseRegistration.certificateId);
      return {
        status: 'has-certificate' as const,
        ...certificate,
        meetPersonId: meetPerson?.id ?? null,
        hasSubmittedActionPlan: (meetPerson?.projectSubmission?.length ?? 0) > 0,
      };
    }

    if (!meetPerson) {
      const hasUpcomingRounds = await hasUpcomingRoundsForCourseId(courseId);
      return { status: 'not-eligible', hasUpcomingRounds } as const;
    }

    if (meetPerson.role === COURSE_ROLE.PARTICIPANT) {
      const round = meetPerson.round
        ? await db.getFirst(roundTable, { filter: { id: meetPerson.round }, sortBy: 'lastDiscussionDate' })
        : null;
      const expectedDiscussionIds = meetPerson.expectedDiscussionsParticipant ?? [];
      const expectedDiscussions = expectedDiscussionIds.length > 0
        ? await db.pg
          .select({ endDateTime: groupDiscussionTable.pg.endDateTime })
          .from(groupDiscussionTable.pg)
          .where(inArray(groupDiscussionTable.pg.id, expectedDiscussionIds))
        : [];

      // A discussion that hasn't ended yet can't have been missed, and a shortfall only counts as
      // final once at most one discussion is still to come. Anything we can't place in the past —
      // no end time, or a row that hasn't synced yet — counts as still to come, so the total comes
      // from the linked ids rather than the rows we managed to read.
      const nowInSeconds = Math.floor(Date.now() / 1000);
      const heldSoFar = expectedDiscussions
        .filter((d) => d.endDateTime != null && d.endDateTime <= nowInSeconds).length;

      // With no discussions linked there is nothing to count, so fall back to the course totals,
      // which only mean anything once the round's last discussion day is fully behind us.
      const hasDiscussionSchedule = expectedDiscussionIds.length > 0;
      const roundEndTime
        = round?.lastDiscussionDate != null ? new Date(round.lastDiscussionDate).getTime() : null;
      const hasAtMostOneDiscussionLeft = hasDiscussionSchedule
        ? expectedDiscussionIds.length - heldSoFar <= 1
        : roundEndTime != null && roundEndTime + ONE_DAY_MS <= Date.now();

      const discussionsHeld = hasDiscussionSchedule ? heldSoFar : (meetPerson.numUnits ?? 0);

      // The attendance rollup syncs separately from the discussions, so a null reads as "not known
      // yet", never as zero: counting it as zero would accuse someone of missing every discussion
      // held so far.
      const attended = meetPerson.uniqueDiscussionAttendance;
      const hasSubmittedActionPlan = (meetPerson.projectSubmission?.length ?? 0) > 0;

      if (attended != null && hasAtMostOneDiscussionLeft && discussionsHeld - attended > 1) {
        return {
          status: 'attendance-ineligible' as const,
          uniqueDiscussionAttendance: attended,
          discussionsHeld,
          meetPersonId: meetPerson.id,
          hasSubmittedActionPlan,
        };
      }

      return {
        status: 'action-plan-pending',
        meetPersonId: meetPerson.id,
        hasSubmittedActionPlan,
        hasAtMostOneDiscussionLeft,
      } as const;
    }

    if (meetPerson.role === COURSE_ROLE.FACILITATOR) {
      const hasUpcomingRounds = await hasUpcomingRoundsForCourseId(courseId);
      return { status: 'is-facilitator', hasUpcomingRounds } as const;
    }

    const hasUpcomingRounds = await hasUpcomingRoundsForCourseId(courseId);
    return { status: 'not-eligible', hasUpcomingRounds } as const;
  }),
});
