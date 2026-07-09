import {
  applicationsCourseTable, selfServeCourseRegistrationTable,
} from '@bluedot/db';
import z from 'zod';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { getUserOrThrow, protectedProcedure, router } from '../trpc';
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

    const user = await getUserOrThrow(ctx.auth.email);
    return db.insert(selfServeCourseRegistrationTable, {
      userId: user.id,
      courseApplicationsBaseId: applicationsCourse.id,
      source: source ?? null,
      createdAt: new Date().toISOString(),
    });
  });

export const selfServeCourseRegistrationsRouter = router({
  ensureExists: ensureSelfServeRegistrationExistsProcedure,
});
