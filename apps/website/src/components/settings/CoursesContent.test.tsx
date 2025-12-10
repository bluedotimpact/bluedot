import {
  describe, it, expect, vi, beforeEach,
} from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CoursesContent from './CoursesContent';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { createMockCourseRegistration, createMockCourse } from '../../__tests__/testUtils';

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows completed/past courses in Completed section, everything else in In Progress', async () => {
    const courses = [
      createMockCourse({ id: 'course-1', title: 'Active No Cert' }),
      createMockCourse({ id: 'course-2', title: 'Past No Cert' }),
      createMockCourse({ id: 'course-3', title: 'Active With Cert' }),
      createMockCourse({ id: 'course-4', title: 'Past With Cert' }),
    ];

    const registrations = [
      // Active + no cert => In Progress
      createMockCourseRegistration({
        id: 'reg-1', courseId: 'course-1', roundStatus: 'Active', certificateCreatedAt: null,
      }),
      // Past + no cert => Completed (key edge case, not fully self-evident but this is the definition we are going with)
      createMockCourseRegistration({
        id: 'reg-2', courseId: 'course-2', roundStatus: 'Past', certificateCreatedAt: null,
      }),
      // Active + cert => Completed (cert takes precedence)
      createMockCourseRegistration({
        id: 'reg-3', courseId: 'course-3', roundStatus: 'Active', certificateCreatedAt: 1700000000,
      }),
      // Past + cert => Completed
      createMockCourseRegistration({
        id: 'reg-4', courseId: 'course-4', roundStatus: 'Past', certificateCreatedAt: 1700000000,
      }),
    ];

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('In Progress (1)')).toBeInTheDocument();
      expect(screen.getByText('Completed (3)')).toBeInTheDocument();
      expect(screen.getByText('Active No Cert')).toBeInTheDocument();
      expect(screen.getByText('Past No Cert')).toBeInTheDocument();
      expect(screen.getByText('Active With Cert')).toBeInTheDocument();
      expect(screen.getByText('Past With Cert')).toBeInTheDocument();
    });
  });

  it('displays empty state when no courses enrolled', async () => {
    server.use(trpcMsw.courses.getAll.query(() => []));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText("You haven't started any courses yet")).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Join a course' })).toBeInTheDocument();
    });
  });

  it('sorts completed courses with no-cert first, then by completion date descending', async () => {
    const courses = [
      createMockCourse({ id: 'course-1', title: 'No Cert' }),
      createMockCourse({ id: 'course-2', title: 'Older Cert' }),
      createMockCourse({ id: 'course-3', title: 'Newer Cert' }),
    ];

    const registrations = [
      createMockCourseRegistration({
        id: 'reg-1', courseId: 'course-1', roundStatus: 'Past', certificateCreatedAt: null,
      }),
      createMockCourseRegistration({
        id: 'reg-2', courseId: 'course-2', roundStatus: 'Past', certificateCreatedAt: 1600000000,
      }),
      createMockCourseRegistration({
        id: 'reg-3', courseId: 'course-3', roundStatus: 'Past', certificateCreatedAt: 1700000000,
      }),
    ];

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      const completedSection = screen.getByLabelText('Completed courses');
      const titles = completedSection.querySelectorAll('[data-testid="course-row"]');
      // No cert first, then newer cert, then older cert
      expect(titles[0]).toHaveTextContent('No Cert');
      expect(titles[1]).toHaveTextContent('Newer Cert');
      expect(titles[2]).toHaveTextContent('Older Cert');
    });
  });
});
