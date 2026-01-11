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

  it('shows past facilitator courses in Facilitated section, active in In Progress', async () => {
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
      // Active facilitator course should be in In Progress
      const inProgressSection = screen.getByLabelText('In Progress courses');
      const inProgressTitles = inProgressSection.querySelectorAll('[data-testid="course-row"]');
      expect(inProgressTitles[0]).toHaveTextContent('Currently facilitating');

      // Past facilitator course should be in Facilitated section
      const facilitatedSection = screen.getByLabelText('Facilitated courses');
      const facilitatedTitles = facilitatedSection.querySelectorAll('[data-testid="course-row"]');
      expect(facilitatedTitles[0]).toHaveTextContent('Facilitated in past');

      // No Completed section should appear
      const completedSection = screen.queryAllByLabelText('Completed courses');
      expect(completedSection).toHaveLength(0);
    });
  });

  it('shows Facilitated section with correct count', async () => {
    const courses = [
      createMockCourse({ id: 'course-1', title: 'Facilitated Course 1' }),
      createMockCourse({ id: 'course-2', title: 'Facilitated Course 2' }),
      createMockCourse({ id: 'course-3', title: 'Facilitated Course 3' }),
    ];

    const registrations = [
      createMockCourseRegistration({
        id: 'reg-1', courseId: 'course-1', roundStatus: 'Past', role: 'Facilitator',
      }),
      createMockCourseRegistration({
        id: 'reg-2', courseId: 'course-2', roundStatus: 'Past', role: 'Facilitator',
      }),
      createMockCourseRegistration({
        id: 'reg-3', courseId: 'course-3', roundStatus: 'Past', role: 'Facilitator',
      }),
    ];

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('Facilitated (3)')).toBeInTheDocument();
    });
  });

  it('separates participant and facilitator courses correctly', async () => {
    const courses = [
      createMockCourse({ id: 'course-1', title: 'Participated Course' }),
      createMockCourse({ id: 'course-2', title: 'Facilitated Course' }),
    ];

    const registrations = [
      createMockCourseRegistration({
        id: 'reg-1', courseId: 'course-1', roundStatus: 'Past', role: 'Participant',
      }),
      createMockCourseRegistration({
        id: 'reg-2', courseId: 'course-2', roundStatus: 'Past', role: 'Facilitator',
      }),
    ];

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      // Participant course in Completed
      const completedSection = screen.getByLabelText('Completed courses');
      expect(completedSection).toHaveTextContent('Participated Course');

      // Facilitator course in Facilitated
      const facilitatedSection = screen.getByLabelText('Facilitated courses');
      expect(facilitatedSection).toHaveTextContent('Facilitated Course');
    });
  });

  it('shows "See all" button when more than 5 courses in a section', async () => {
    const courses = Array.from({ length: 7 }, (_, i) => createMockCourse({ id: `course-${i}`, title: `Facilitated Course ${i}` }));

    const registrations = Array.from({ length: 7 }, (_, i) => createMockCourseRegistration({
      id: `reg-${i}`, courseId: `course-${i}`, roundStatus: 'Past', role: 'Facilitator',
    }));

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('See all (7) courses')).toBeInTheDocument();
    });
  });

  it('does not show "See all" button when 5 or fewer courses', async () => {
    const courses = Array.from({ length: 5 }, (_, i) => createMockCourse({ id: `course-${i}`, title: `Facilitated Course ${i}` }));

    const registrations = Array.from({ length: 5 }, (_, i) => createMockCourseRegistration({
      id: `reg-${i}`, courseId: `course-${i}`, roundStatus: 'Past', role: 'Facilitator',
    }));

    server.use(trpcMsw.courses.getAll.query(() => courses));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => registrations));

    render(<CoursesContent />, { wrapper: TrpcProvider });

    await waitFor(() => {
      expect(screen.getByText('Facilitated (5)')).toBeInTheDocument();
      expect(screen.queryByText(/See all.*courses/)).not.toBeInTheDocument();
    });
  });
});
