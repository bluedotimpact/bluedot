import { applicationsCourseTable, courseRegistrationTable } from '@bluedot/db';
import z from 'zod';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { FOAI_COURSE_ID } from '../../lib/constants';

export const courseRegistrationsRouter = router({
  getByCourseId: protectedProcedure
    .input(z.object({ courseId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { courseId } = input;
      return db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          courseId,
          decision: 'Accept',
        },
      });
    }),

  getAll: protectedProcedure.query(async ({ ctx }) => {
    return db.scan(courseRegistrationTable, {
      email: ctx.auth.email,
      decision: 'Accept',
    });
  }),

  ensureExists: protectedProcedure
    .input(z.object({ courseId: z.string(), source: z.string().trim().max(255).optional() }))
    // This mutation will create a course registration if one doesn't already exist for FOAI course.
    .mutation(async ({ ctx, input }) => {
      const { courseId, source } = input;
      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          courseId,
          decision: 'Accept',
        },
      });

      // If the course registration already exists, return it
      if (courseRegistration) return courseRegistration;

      if (courseId === FOAI_COURSE_ID) {
        const applicationsCourse = await db.getFirst(applicationsCourseTable, {
          sortBy: 'id',
          filter: { courseBuilderId: courseId },
        });

        if (!applicationsCourse) {
          throw new TRPCError({ code: 'NOT_FOUND', message: `Course configuration not found for course: ${courseId}` });
        }

        return db.insert(courseRegistrationTable, {
          email: ctx.auth.email,
          courseApplicationsBaseId: applicationsCourse.id,
          role: 'Participant',
          decision: 'Accept',
          source: source ?? null,
        });
      }

      return null;
    }),
});
