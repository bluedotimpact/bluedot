import { z } from 'zod';
import createHttpError from 'http-errors';
import { formula } from 'airtable-ts-formula';
import { makeApiRoute } from '../../../lib/api/makeApiRoute';
import db from '../../../lib/api/db';
import {
  CourseRegistration,
  courseRegistrationTable,
} from '../../../lib/api/db/tables';

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
      const courseRegistrations = (await db.scan(courseRegistrationTable, {
        filterByFormula: formula(await db.table(courseRegistrationTable), [
          'AND',
          ['=', { field: 'email' }, auth.email],
          ['=', { field: 'decision' }, 'Accept'],
        ]),
      }));

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
