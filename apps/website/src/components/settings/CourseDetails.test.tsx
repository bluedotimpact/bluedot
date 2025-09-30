import {
  describe, it, expect, vi,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import useAxios from 'axios-hooks';
import { mockCourse as createMockCourse } from '../../__tests__/testUtils';
import CourseDetails from './CourseDetails';

// Mock axios-hooks
vi.mock('axios-hooks');

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

  const mockCourseRegistration = {
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
    lastVisitedCourseContentPath: null,
    lastVisitAt: null,
    lastVisitedChunkIndex: null,
    roundStatus: 'Active',
  };

  it('displays expanded course details region', async () => {
    // Mock the API call for discussions
    vi.mocked(useAxios).mockReturnValue([{
      data: { discussions: [] },
      loading: false,
      error: null,
    }, () => {}, () => {}] as unknown as ReturnType<typeof useAxios>);

    render(
      <CourseDetails
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
      />,
    );

    // Check for the expanded region
    await waitFor(() => {
      expect(screen.getByRole('region', { name: 'Expanded details for Introduction to AI Safety' })).toBeInTheDocument();
    });

    // Check for the upcoming discussions section
    expect(screen.getByText('Upcoming discussions')).toBeInTheDocument();
    expect(screen.getByText('No upcoming discussions')).toBeInTheDocument();
  });
});
