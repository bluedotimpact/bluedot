import '@testing-library/jest-dom';
import {
  act, render, screen,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createMockCourse, createMockCourseRegistration, createMockMeetPerson } from '../../__tests__/testUtils';
import CourseListRow from './CourseListRow';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';

type MockCourseDetailsProps = {
  course: { title: string };
};

// Mock the CourseDetails component to avoid testing it here
vi.mock('./CourseDetails', () => ({
  default: ({ course }: MockCourseDetailsProps) => (
    <div aria-label={`Expanded details for ${course.title}`}>Course Details Content</div>
  ),
}));

describe('CourseListRow', () => {
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

  const mockMeetPerson = createMockMeetPerson();

  const mockDiscussions = {
    discussions: [],
  };

  beforeEach(() => {
    vi.stubEnv('TZ', 'UTC');

    server.use(
      trpcMsw.meetPerson.getByCourseRegistrationId.query(() => mockMeetPerson),
      trpcMsw.groupDiscussions.getByDiscussionIds.query(() => mockDiscussions),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('renders in-progress course correctly (snapshot)', () => {
    const { container } = render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
        isCompleted={false}
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('renders completed course correctly (snapshot)', () => {
    const completedRegistration = {
      ...mockCourseRegistration,
      certificateCreatedAt: new Date('2024-01-01').getTime() / 1000, // Jan 1, 2024 in seconds
      certificateId: 'cert-123',
    };

    const { container } = render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={completedRegistration}
        isCompleted
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('shows collapse button for in-progress course (expanded by default)', () => {
    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
        isCompleted={false}
      />,
      { wrapper: TrpcProvider },
    );

    // Check for collapse button since in-progress courses are expanded by default
    const collapseButtons = screen.getAllByLabelText('Collapse Introduction to AI Safety details');
    expect(collapseButtons.length).toBeGreaterThan(0);
    expect(collapseButtons[0]).toHaveAttribute('aria-expanded', 'true');

    // The component renders the title (multiple times for responsive design)
    const titleElements = screen.getAllByText('Introduction to AI Safety');
    expect(titleElements.length).toBeGreaterThan(0);

    // Should show expanded details
    expect(screen.getByLabelText('Expanded details for Introduction to AI Safety')).toBeInTheDocument();
  });

  it('shows view certificate link for completed course', () => {
    const completedRegistration = {
      ...mockCourseRegistration,
      certificateCreatedAt: new Date('2024-01-01').getTime() / 1000, // Jan 1, 2024 in seconds
      certificateId: 'cert-123',
    };

    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={completedRegistration}
        isCompleted
      />,
      { wrapper: TrpcProvider },
    );

    const certificateLinks = screen.getAllByRole('link', { name: 'View your certificate' });
    expect(certificateLinks[0]).toBeInTheDocument();
    const completedTexts = screen.getAllByText(/Completed on/);
    expect(completedTexts.length).toBeGreaterThan(0);

    // Completed courses should not have expand/collapse buttons
    expect(screen.queryByLabelText(/Expand.*details/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Collapse.*details/)).not.toBeInTheDocument();

    // Completed courses should not show expanded details
    expect(screen.queryByLabelText('Expanded details for Introduction to AI Safety')).not.toBeInTheDocument();
  });

  it('collapses and expands course details', async () => {
    const user = userEvent.setup();
    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
        isCompleted={false}
      />,
      { wrapper: TrpcProvider },
    );

    // In-progress courses are expanded by default
    const collapseButtons = screen.getAllByLabelText('Collapse Introduction to AI Safety details');
    const collapseButton = collapseButtons[0]!;
    expect(screen.getByLabelText('Expanded details for Introduction to AI Safety')).toBeInTheDocument();

    // Click to collapse
    await act(async () => {
      await user.click(collapseButton);
    });

    expect(screen.queryByLabelText('Expanded details for Introduction to AI Safety')).not.toBeInTheDocument();
    expect(collapseButton).toHaveAttribute('aria-expanded', 'false');
    expect(collapseButton).toHaveAttribute('aria-label', 'Expand Introduction to AI Safety details');

    // Click to expand again
    await act(async () => {
      await user.click(collapseButton);
    });

    expect(screen.getByLabelText('Expanded details for Introduction to AI Safety')).toBeInTheDocument();
    expect(collapseButton).toHaveAttribute('aria-expanded', 'true');
    expect(collapseButton).toHaveAttribute('aria-label', 'Collapse Introduction to AI Safety details');
  });
});
