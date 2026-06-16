import {
  applicationsCourseTable, COURSE_ROLE, courseRegistrationTable, selfServeCourseRegistrationTable, userTable,
} from '@bluedot/db';
import z from 'zod';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { FOAI_COURSE_ID } from '../../lib/constants';

export const ensureSelfServeRegistrationExistsProcedure = protectedProcedure
  .input(z.object({ courseId: z.string(), source: z.string().trim().max(255).optional() }))
  .mutation(async ({ ctx, input }) => {
    const { courseId, source } = input;

    if (courseId !== FOAI_COURSE_ID) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Only the Future of AI course supports self-serve registration' });
    }

    const existingRegistration = await db.getFirst(selfServeCourseRegistrationTable, {
      filter: { email: ctx.auth.email, courseId },
      sortBy: 'createdAt',
    });

    if (existingRegistration) {
      return existingRegistration;
    }

    const applicationsCourse = await db.getFirst(applicationsCourseTable, {
      sortBy: 'id',
      filter: { courseBuilderId: courseId },
    });
    if (!applicationsCourse) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `Course configuration not found for course: ${courseId}` });
    }

    // The User row is created by a lagging login side-effect (oauth-callback). Fail before writing
    // anything so the client retries
    const user = await db.getFirst(userTable, { filter: { email: ctx.auth.email } });
    if (!user) {
      throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'User record not available yet' });
    }

    const selfServeRegistration = await db.insert(selfServeCourseRegistrationTable, {
      userId: user.id,
      courseApplicationsBaseId: applicationsCourse.id,
      source: source ?? null,
      createdAt: new Date().toISOString(),
    });

    // Keep dual-writing the legacy row until the migration to the self-serve table (#2526)
    // is fully complete
    const existingLegacy = await db.getFirst(courseRegistrationTable, {
      filter: { email: ctx.auth.email, courseId, decision: 'Accept' },
    });
    if (!existingLegacy) {
      await db.insert(courseRegistrationTable, {
        email: ctx.auth.email,
        courseApplicationsBaseId: applicationsCourse.id,
        role: COURSE_ROLE.PARTICIPANT,
        decision: 'Accept',
        source: source ?? null,
      });
    }

    return selfServeRegistration;
  });

export const selfServeCourseRegistrationsRouter = router({
  ensureExists: ensureSelfServeRegistrationExistsProcedure,
});
