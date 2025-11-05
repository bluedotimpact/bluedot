import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { mockCourse as createMockCourse, createMockCourseRegistration } from '../../__tests__/testUtils';
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

  const mockCourseRegistration = createMockCourseRegistration({
    courseId: 'course-1',
  });

  it('displays expanded course details region', async () => {
    server.use(
      trpcMsw.groupDiscussions.getByDiscussionIds.query(() => ({ discussions: [] })),
    );

    render(
      <CourseDetails
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
        currentTimeSeconds={Math.floor(Date.now() / 1000)}
        upcomingDiscussions={[]}
        attendedDiscussionIds={[]}
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
