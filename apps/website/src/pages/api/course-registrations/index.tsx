import { z } from 'zod';
import createHttpError from 'http-errors';
import {
  eq, and, courseRegistrationTable, InferSelectModel,
} from '@bluedot/db';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';

type CourseRegistration = InferSelectModel<typeof courseRegistrationTable.pg>;

export type GetCourseRegistrationsResponse = {
  type: 'success';
  courseRegistrations: CourseRegistration[];
};

export default makeApiRoute({
  requireAuth: true,
  responseBody: z.object({
    type: z.literal('success'),
    courseRegistrations: z.any().array(),
  }),
}, async (body, { auth, raw }) => {
  switch (raw.req.method) {
    case 'GET': {
      const courseRegistrations = await db.pg.select()
        .from(courseRegistrationTable.pg)
        .where(and(
          eq(courseRegistrationTable.pg.email, auth.email),
          eq(courseRegistrationTable.pg.decision, 'Accept'),
        ));

      return {
        type: 'success' as const,
        courseRegistrations,
      };
    }

    default: {
      throw new createHttpError.MethodNotAllowed();
    }
  }
});
