import { courseRegistrationTable, MeetPerson, meetPersonTable } from '@bluedot/db';
import { TRPCError } from '@trpc/server';
import z from 'zod';
import db from '../../lib/api/db';
import { protectedProcedure, router } from '../trpc';

// GH-1876: Mock meet person data for UI testing (only in development)
// These correspond to mock course registration IDs in CoursesContent.tsx
const MOCK_MEET_PERSON_DATA: Record<string, Partial<MeetPerson>> = {
  'mock-reg-1': { // No cert, action plan not submitted
    id: 'mock-meet-person-1',
    uniqueDiscussionAttendance: 2,
    numUnits: 5,
    groupsAsParticipant: ['group-1'],
    courseFeedbackForm: 'https://airtable.com/example-feedback-form',
    courseFeedback: [],
    projectSubmission: [],
  },
  'mock-reg-2': { // No cert, action plan submitted
    id: 'mock-meet-person-2',
    uniqueDiscussionAttendance: 2,
    numUnits: 5,
    groupsAsParticipant: ['group-1'],
    courseFeedbackForm: 'https://airtable.com/example-feedback-form',
    courseFeedback: [],
    projectSubmission: ['action-plan-record-1'],
  },
  'mock-reg-3': { // Certificate exists, feedback not submitted (locked)
    id: 'mock-meet-person-3',
    uniqueDiscussionAttendance: 5,
    numUnits: 5,
    groupsAsParticipant: ['group-1'],
    courseFeedbackForm: 'https://airtable.com/example-feedback-form',
    courseFeedback: [],
    projectSubmission: ['action-plan-record-1'],
  },
  'mock-reg-4': { // Certificate exists, feedback submitted
    id: 'mock-meet-person-4',
    uniqueDiscussionAttendance: 5,
    numUnits: 5,
    groupsAsParticipant: ['group-1'],
    courseFeedbackForm: 'https://airtable.com/example-feedback-form',
    courseFeedback: ['feedback-record-1'],
    projectSubmission: ['action-plan-record-1'],
  },
};

export const meetPersonRouter = router({
  getByCourseRegistrationId: protectedProcedure
    .input(z.object({ courseRegistrationId: z.string() }))
    .query(async ({ input: { courseRegistrationId }, ctx }) => {
      // GH-1876: Return mock data for testing UI states (development only)
      if (courseRegistrationId.startsWith('mock-reg-') && process.env.NODE_ENV !== 'production') {
        const mockData = MOCK_MEET_PERSON_DATA[courseRegistrationId];
        if (mockData) {
          return mockData as MeetPerson;
        }
      }

      const courseRegistration = await db.getFirst(courseRegistrationTable, {
        filter: {
          id: courseRegistrationId,
          email: ctx.auth.email,
        },
      });

      if (!courseRegistration) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Course registration not found' });
      }

      // Note: `courseRegistration.id` is the same as `courseRegistrationId`. However, we need to ensure that the user
      // owns the course registration before fetching the meet person record.

      return db.getFirst(meetPersonTable, {
        filter: {
          applicationsBaseRecordId: courseRegistration.id,
        },
      });
    }),
});
