import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import useAxios from 'axios-hooks';
import '@testing-library/jest-dom';
import CoursesContent from './CoursesContent';

vi.mock('axios-hooks');

type MockCourseListRowProps = {
  course: { title: string };
  courseRegistration: { certificateCreatedAt: number | null };
};

// Mock CourseListRow to simplify testing
vi.mock('./CourseListRow', () => ({
  default: ({ course, courseRegistration }: MockCourseListRowProps) => (
    <div data-testid="course-row">
      <span>{course.title}</span>
      <span>{courseRegistration.certificateCreatedAt ? 'Completed' : 'In Progress'}</span>
    </div>
  ),
}));

describe('CoursesContent', () => {
  const mockCourse = {
    id: 'course-1',
    title: 'Introduction to AI Safety',
    description: 'Learn the fundamentals of AI safety.',
    durationDescription: '8 weeks',
    image: '/course-image.jpg',
    path: '/courses/ai-safety',
  };

  const mockCourseRegistration = {
    id: 'reg-1',
    courseId: 'course-1',
    certificateCreatedAt: null,
    certificateId: null,
    lastVisitedChunkIndex: null,
    roundStatus: 'Active', // Add roundStatus for in-progress filtering
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays in-progress courses', async () => {
    vi.mocked(useAxios).mockImplementation((config) => {
      const url = typeof config === 'string' ? config : config.url;
      if (url === '/api/course-registrations') {
        return [{
          data: { courseRegistrations: [mockCourseRegistration] },
          loading: false,
          error: null,
        }, () => {}, () => {}] as unknown as ReturnType<typeof useAxios>;
      }
      return [{
        data: { courses: [mockCourse] },
        loading: false,
        error: null,
      }, () => {}, () => {}] as unknown as ReturnType<typeof useAxios>;
    });

    render(<CoursesContent authToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByLabelText('In Progress courses')).toBeInTheDocument();
      expect(screen.getByText('In Progress (1)')).toBeInTheDocument();
      expect(screen.getByText('Introduction to AI Safety')).toBeInTheDocument();
    });
  });

  it('displays empty state when no courses enrolled', async () => {
    vi.mocked(useAxios).mockImplementation((config) => {
      const url = typeof config === 'string' ? config : config.url;
      if (url === '/api/course-registrations') {
        return [{
          data: { courseRegistrations: [] },
          loading: false,
          error: null,
        }, () => {}, () => {}] as unknown as ReturnType<typeof useAxios>;
      }
      return [{
        data: { courses: [] },
        loading: false,
        error: null,
      }, () => {}, () => {}] as unknown as ReturnType<typeof useAxios>;
    });

    render(<CoursesContent authToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText("You haven't started any courses yet")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Join a course' })).toBeInTheDocument();
    });
  });
});
