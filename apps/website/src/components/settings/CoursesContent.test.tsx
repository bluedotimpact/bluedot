import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import useAxios from 'axios-hooks';
import '@testing-library/jest-dom';
import CoursesContent from './CoursesContent';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { createMockCourseRegistration } from '../../__tests__/testUtils';

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
  const courseId = 'course-1';
  const mockCourse = {
    id: courseId,
    title: 'Introduction to AI Safety',
    description: 'Learn the fundamentals of AI safety.',
    durationDescription: '8 weeks',
    image: '/course-image.jpg',
    path: '/courses/ai-safety',
  };

  const mockCourseRegistration = createMockCourseRegistration({ courseId });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays in-progress courses', async () => {
    server.use(trpcMsw.courseRegistrations.getAll.query(() => [mockCourseRegistration]));

    vi.mocked(useAxios).mockReturnValue([{
      data: { courses: [mockCourse] },
      loading: false,
      error: null,
    }, () => {}, () => {}] as unknown as ReturnType<typeof useAxios>);

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByLabelText('In Progress courses')).toBeInTheDocument();
      expect(screen.getByText('In Progress (1)')).toBeInTheDocument();
      expect(screen.getByText('Introduction to AI Safety')).toBeInTheDocument();
    });
  });

  it('displays empty state when no courses enrolled', async () => {
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));

    vi.mocked(useAxios).mockReturnValue([{
      data: { courses: [] },
      loading: false,
      error: null,
    }, () => {}, () => {}] as unknown as ReturnType<typeof useAxios>);

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText("You haven't started any courses yet")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Join a course' })).toBeInTheDocument();
    });
  });
});
