import { courseRegistrationTable, meetPersonTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

export const meetPersonRouter = router({
  getByCourseRegistrationId: protectedProcedure
    .input(z.object({ courseRegistrationId: z.string() }))
    .query(async ({ input: { courseRegistrationId }, ctx }) => {
      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          id: courseRegistrationId,
          email: ctx.auth.email,
        },
      });

      if (!courseRegistration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course registration not found' });
      }

      return db.getFirst(meetPersonTable, {
        filter: {
          applicationsBaseRecordId: courseRegistration.id,
        },
      });
    }),
});
