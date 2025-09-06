import { z } from 'zod';
import {
  courseRegistrationTable,
  meetPersonTable,
} from '@bluedot/db';
import db from '../../lib/api/db';
import { makeApiRoute } from '../../lib/api/makeApiRoute';

export default makeApiRoute({
  requireAuth: true,
  requestBody: z.object({
    courseRegistrationId: z.string().optional(),
  }).optional(),
  responseBody: z.object({
    type: z.literal('success'),
    meetPerson: z.any().nullable(),
  }),
}, async (body, { auth, raw }) => {
  // Support both query params and body
  const courseRegistrationId = raw.req.query.courseRegistrationId as string | undefined || body?.courseRegistrationId;

  if (!courseRegistrationId) {
    return {
      type: 'success' as const,
      meetPerson: null,
    };
  }

  // Get the course registration to verify ownership
  let courseRegistration;
  try {
    courseRegistration = await db.getFirst(courseRegistrationTable, {
      filter: {
        id: courseRegistrationId,
        email: auth.email,
      },
    });

    if (!courseRegistration) {
      return {
        type: 'success' as const,
        meetPerson: null,
      };
    }
  } catch {
    return {
      type: 'success' as const,
      meetPerson: null,
    };
  }

  // Get the meetPerson linked to this course registration
  let meetPerson;
  try {
    meetPerson = await db.getFirst(meetPersonTable, {
      filter: {
        applicationsBaseRecordId: courseRegistration.id,
      },
    });
  } catch {
    return {
      type: 'success' as const,
      meetPerson: null,
    };
  }

  return {
    type: 'success' as const,
    meetPerson: meetPerson || null,
  };
});
