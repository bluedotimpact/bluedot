import { applicationsCourseTable, courseRegistrationTable } from '@bluedot/db';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const courseRegistrationsRouter = router({
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          email: ctx.auth.email,
          courseId: input,
          decision: 'Accept',
        },
      });
      if (courseRegistration) return courseRegistration;

      const applicationsCourse = await db.get(applicationsCourseTable, { courseBuilderId: input });
      return db.insert(courseRegistrationTable, {
        email: ctx.auth.email,
        courseApplicationsBaseId: applicationsCourse.id,
        role: 'Participant',
        decision: 'Accept',
      });
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return db.scan(courseRegistrationTable, {
      email: ctx.auth.email,
      decision: 'Accept',
    });
  }),
});
