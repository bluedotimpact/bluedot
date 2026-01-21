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

  it('shows "Past" courses in Completed section, everything else in In Progress', async () => {
    const courses = [
      createMockCourse({ id: 'course-1', title: 'Active No Cert' }),
      createMockCourse({ id: 'course-2', title: 'Past No Cert' }),
    ];

    const registrations = [
      // Active => In Progress
      createMockCourseRegistration({
        id: 'reg-1', courseId: 'course-1', roundStatus: 'Active', certificateCreatedAt: null,
      }),
      // Past => Completed (roundStatus is what matters, not certificate)
      createMockCourseRegistration({
        id: 'reg-2', courseId: 'course-2', roundStatus: 'Past', certificateCreatedAt: null,
      }),
    ];

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('In Progress (1)')).toBeInTheDocument();
      expect(screen.getByText('Completed (1)')).toBeInTheDocument();
      expect(screen.getByText('Active No Cert')).toBeInTheDocument();
      expect(screen.getByText('Past No Cert')).toBeInTheDocument();
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

  it('shows facilitator courses in correct sections (active in In Progress, past in Facilitated)', async () => {
    const courses = [
      createMockCourse({ id: 'course-1', title: 'Currently facilitating' }),
      createMockCourse({ id: 'course-2', title: 'Facilitated in past' }),
    ];

    const registrations = [
      createMockCourseRegistration({
        id: 'reg-1', courseId: 'course-1', roundStatus: 'Active', certificateCreatedAt: null, role: 'Facilitator',
      }),
      createMockCourseRegistration({
        id: 'reg-2', courseId: 'course-2', roundStatus: 'Past', certificateCreatedAt: null, role: 'Facilitator',
      }),
    ];

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      // Active facilitator course in In Progress
      expect(screen.getByText('In Progress (1)')).toBeInTheDocument();
      const inProgressSection = screen.getByLabelText('In Progress courses');
      expect(inProgressSection).toHaveTextContent('Currently facilitating');

      // Past facilitator course in Facilitated section
      expect(screen.getByText('Facilitated (1)')).toBeInTheDocument();
      const facilitatedSection = screen.getByLabelText('Facilitated courses');
      expect(facilitatedSection).toHaveTextContent('Facilitated in past');

      // No Completed section (that's for participants)
      expect(screen.queryByLabelText('Completed courses')).not.toBeInTheDocument();
    });
  });

  it('filters out dropped out courses but shows deferred courses', async () => {
    const courses = [
      createMockCourse({ id: 'course-1', title: 'Normal Course' }),
      createMockCourse({ id: 'course-2', title: 'Dropped Out Course' }),
      createMockCourse({ id: 'course-3', title: 'Deferred Course' }),
    ];

    const registrations = [
      // Normal course - should appear
      createMockCourseRegistration({
        id: 'reg-1',
        courseId: 'course-1',
        roundStatus: 'Active',
        certificateCreatedAt: null,
      }),
      // Dropped out course (has dropoutId but no deferredId) - should be filtered out
      createMockCourseRegistration({
        id: 'reg-2',
        courseId: 'course-2',
        roundStatus: 'Active',
        certificateCreatedAt: null,
        dropoutId: ['dropout-1'],
      }),
      // Deferred course (has deferredId but no dropoutId) - should appear
      createMockCourseRegistration({
        id: 'reg-3',
        courseId: 'course-3',
        roundStatus: 'Active',
        certificateCreatedAt: null,
        deferredId: ['deferred-1'],
      }),
    ];

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      // Should show 2 courses in In Progress section (normal + deferred)
      expect(screen.getByText('In Progress (2)')).toBeInTheDocument();

      // Normal course should appear
      expect(screen.getByText('Normal Course')).toBeInTheDocument();

      // Deferred course should appear
      expect(screen.getByText('Deferred Course')).toBeInTheDocument();

      // Dropped out course should NOT appear
      expect(screen.queryByText('Dropped Out Course')).not.toBeInTheDocument();
    });
  });

  it('does not show deferred courses when they have past status', async () => {
    const courses = [
      createMockCourse({ id: 'course-1', title: 'Deferred Past Course' }),
    ];

    const registrations = [
      // Deferred course with Past status - should not be shown at all
      createMockCourseRegistration({
        id: 'reg-1',
        courseId: 'course-1',
        roundStatus: 'Past',
        certificateCreatedAt: 1672531200,
        deferredId: ['deferred-1'],
      }),
    ];

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      // Should show empty state since deferred past courses are not shown
      expect(screen.getByText("You haven't started any courses yet")).toBeInTheDocument();
      expect(screen.queryByText('Deferred Past Course')).not.toBeInTheDocument();
    });
  });
});
