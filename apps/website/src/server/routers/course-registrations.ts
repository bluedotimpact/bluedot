import { applicationsCourseTable, courseRegistrationTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const courseRegistrationsRouter = router({
  getById: protectedProcedure
    .input(z.string())
    .query(async ({ ctx, input }) => {
      try {
        const courseRegistration = await db.getFirst(courseRegistrationTable, {
          filter: {
            email: ctx.auth.email,
            courseId: input,
            decision: 'Accept',
          },
        });
        if (courseRegistration) return courseRegistration;

        const applicationsCourse = await db.get(applicationsCourseTable, { courseBuilderId: input });
        return await db.insert(courseRegistrationTable, {
          email: ctx.auth.email,
          courseApplicationsBaseId: applicationsCourse.id,
          role: 'Participant',
          decision: 'Accept',
        });
      } catch (error) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database error occurred' });
      }
    }),
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return db.scan(courseRegistrationTable, {
      email: ctx.auth.email,
      decision: 'Accept',
    });
  }),
});
