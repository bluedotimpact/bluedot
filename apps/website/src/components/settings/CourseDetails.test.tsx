import type { CourseRegistration } from '@bluedot/db';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mockCourse as createMockCourse } from '../../__tests__/testUtils';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import CourseDetails from './CourseDetails';

// Mock GroupSwitchModal to avoid testing it here
vi.mock('../courses/GroupSwitchModal', () => ({
  default: () => null,
}));

describe('CourseDetails', () => {
  const mockCourse = createMockCourse({
    id: 'course-1',
    title: 'Introduction to AI Safety',
    description: 'Learn the fundamentals of AI safety and alignment.',
    durationDescription: '8 weeks',
    image: '/course-image.jpg',
    path: '/courses/ai-safety',
    slug: 'ai-safety',
    cadence: 'Weekly',
    level: 'Beginner',
  });

  const mockCourseRegistration: CourseRegistration = {
    autoNumberId: 1,
    id: 'reg-1',
    courseId: 'course-1',
    certificateCreatedAt: null,
    certificateId: null,
    email: 'test@example.com',
    userId: 'user-1',
    firstName: 'Test',
    lastName: 'User',
    fullName: 'Test User',
    courseApplicationsBaseId: null,
    decision: null,
    role: null,
    lastVisitedUnitNumber: null,
    lastVisitedChunkIndex: null,
    roundStatus: 'Active',
    source: null,
  };

  it('displays expanded course details region', async () => {
    // Mock the tRPC call for meetPerson
    server.use(
      trpcMsw.meetPerson.getByCourseRegistrationId.query(() => (null)),
    );

    render(
      <CourseDetails
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
      />,
      { wrapper: TrpcProvider },
    );

    // Check for the expanded region
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Expanded details for Introduction to AI Safety' })).toBeInTheDocument();
    });

    // Check for the upcoming discussions section
    expect(screen.getByText('Upcoming discussions')).toBeInTheDocument();

    // Wait for loading to complete and content to be displayed
    await waitFor(() => {
      expect(screen.getByText('No upcoming discussions')).toBeInTheDocument();
    });
  });
});
