import { applicationsCourseTable, courseRegistrationTable } from '@bluedot/db';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

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

      const applicationsCourse = await db.get(applicationsCourseTable, { courseBuilderId: courseId });
      return db.insert(courseRegistrationTable, {
        email: ctx.auth.email,
        courseApplicationsBaseId: applicationsCourse.id,
        role: 'Participant',
        decision: 'Accept',
        source,
      });
    }),
});
