import { applicationsCourseTable, CourseRegistration, courseRegistrationTable } from '@bluedot/db';
import z from 'zod';
import { TRPCError } from '@trpc/server';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';
import { FOAI_COURSE_ID } from '../../lib/constants';

// GH-1876: Mock course registrations for UI testing (only in development)
// These correspond to mock meet person data in meet-person.ts
const MOCK_COURSE_REGISTRATIONS: Partial<CourseRegistration>[] = [
  // Case 1: No cert, action plan NOT submitted
  {
    id: 'mock-reg-1',
    courseId: 'mock-course-agi',
    roundStatus: 'Past',
    certificateId: null,
    certificateCreatedAt: null,
    decision: 'Accept',
    role: 'Participant',
  },
  // Case 2: No cert, action plan SUBMITTED
  {
    id: 'mock-reg-2',
    courseId: 'mock-course-agi',
    roundStatus: 'Past',
    certificateId: null,
    certificateCreatedAt: null,
    decision: 'Accept',
    role: 'Participant',
  },
  // Case 3: Certificate exists, feedback NOT submitted (locked)
  {
    id: 'mock-reg-3',
    courseId: 'mock-course-agi',
    roundStatus: 'Past',
    certificateId: 'cert-123',
    certificateCreatedAt: 1710288000, // Mar 12, 2025
    decision: 'Accept',
    role: 'Participant',
  },
  // Case 4: Certificate exists, feedback SUBMITTED
  {
    id: 'mock-reg-4',
    courseId: 'mock-course-agi',
    roundStatus: 'Past',
    certificateId: 'cert-456',
    certificateCreatedAt: 1710288000, // Mar 12, 2025
    decision: 'Accept',
    role: 'Participant',
  },
];

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
    const realRegistrations = await db.scan(courseRegistrationTable, {
      email: ctx.auth.email,
      decision: 'Accept',
    });

    // GH-1876: Add mock registrations for UI testing (development only)
    if (process.env.NODE_ENV !== 'production') {
      return [...realRegistrations, ...MOCK_COURSE_REGISTRATIONS as CourseRegistration[]];
    }

    return realRegistrations;
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
