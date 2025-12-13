import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
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
    const inProgressRegistration = {
      ...mockCourseRegistration,
      roundStatus: 'Active',
      certificateCreatedAt: null,
    };

    const { container } = render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={inProgressRegistration}
        isFirst={false}
        isLast={false}
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('renders completed course correctly (snapshot)', () => {
    const completedRegistration = {
      ...mockCourseRegistration,
      roundStatus: 'Past',
      certificateCreatedAt: new Date('2024-01-01').getTime() / 1000, // Jan 1, 2024 in seconds
      certificateId: 'cert-123',
    };

    const { container } = render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={completedRegistration}
        isFirst={false}
        isLast={false}
      />,
      { wrapper: TrpcProvider },
    );
    expect(container).toMatchSnapshot();
  });

  it('starts expanded when startExpanded prop is true', () => {
    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
        isFirst={false}
        isLast={false}
        startExpanded
      />,
      { wrapper: TrpcProvider },
    );

    // Check for collapse button since course is expanded
    const collapseButtons = screen.getAllByLabelText('Collapse Introduction to AI Safety details');
    expect(collapseButtons.length).toBeGreaterThan(0);
    expect(collapseButtons[0]).toHaveAttribute('aria-expanded', 'true');

    // Should show expanded details
    expect(screen.getByLabelText('Expanded details for Introduction to AI Safety')).toBeInTheDocument();
  });

  it('starts collapsed when startExpanded prop is false (default)', () => {
    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
        isFirst={false}
        isLast={false}
      />,
      { wrapper: TrpcProvider },
    );

    // Check for expand button since course is collapsed
    const expandButtons = screen.getAllByLabelText('Expand Introduction to AI Safety details');
    expect(expandButtons.length).toBeGreaterThan(0);
    expect(expandButtons[0]).toHaveAttribute('aria-expanded', 'false');

    // Should not show expanded details
    expect(screen.queryByLabelText('Expanded details for Introduction to AI Safety')).not.toBeInTheDocument();
  });

  it('shows view certificate link for completed course', () => {
    const completedRegistration = {
      ...mockCourseRegistration,
      roundStatus: 'Past',
      certificateCreatedAt: new Date('2024-01-01').getTime() / 1000, // Jan 1, 2024 in seconds
      certificateId: 'cert-123',
    };

    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={completedRegistration}
        isFirst={false}
        isLast={false}
      />,
      { wrapper: TrpcProvider },
    );

    const certificateLinks = screen.getAllByRole('link', { name: 'View your certificate' });
    expect(certificateLinks[0]).toBeInTheDocument();
    const completedTexts = screen.getAllByText(/Completed on/);
    expect(completedTexts.length).toBeGreaterThan(0);
  });

  it('collapses and expands course details', async () => {
    const user = userEvent.setup();
    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={mockCourseRegistration}
        isFirst={false}
        isLast={false}
        startExpanded
      />,
      { wrapper: TrpcProvider },
    );

    // Started expanded
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

  it('shows requirement message when course is "Past" with no cert: missed too many discussions', async () => {
    const pastNoCertRegistration = {
      ...mockCourseRegistration,
      roundStatus: 'Past',
      certificateCreatedAt: null,
      certificateId: null,
    };

    // Mock meetPerson with 5 expected but only 2 attended (missed 3, which is > 1)
    const meetPersonMissedTooMany = {
      ...mockMeetPerson,
      expectedDiscussionsParticipant: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
      attendedDiscussions: ['disc-1', 'disc-2'],
      projectSubmission: null,
    };

    const mockExpectedDiscussions = {
      discussions: [
        {
          id: 'disc-1', startDateTime: 1000, endDateTime: 2000, unitNumber: 1,
        },
        {
          id: 'disc-2', startDateTime: 3000, endDateTime: 4000, unitNumber: 2,
        },
        {
          id: 'disc-3', startDateTime: 5000, endDateTime: 6000, unitNumber: 3,
        },
        {
          id: 'disc-4', startDateTime: 7000, endDateTime: 8000, unitNumber: 4,
        },
        {
          id: 'disc-5', startDateTime: 9000, endDateTime: 10000, unitNumber: 5,
        },
      ],
    };

    server.use(
      trpcMsw.meetPerson.getByCourseRegistrationId.query(() => meetPersonMissedTooMany),
      // @ts-expect-error
      trpcMsw.groupDiscussions.getByDiscussionIds.query(() => mockExpectedDiscussions),
    );

    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={pastNoCertRegistration}
        isFirst={false}
        isLast={false}
      />,
      { wrapper: TrpcProvider },
    );

    // Wait for the subtitle to appear (multiple elements due to responsive design)
    const subtitleTexts = await screen.findAllByText(/To receive a certificate you can miss at most 1 discussion/);
    expect(subtitleTexts.length).toBeGreaterThan(0);
  });

  it('shows requirement message when course is "Past" with no cert: submit action plan', async () => {
    const agiStrategyCourse = {
      ...mockCourse,
      slug: 'agi-strategy',
    };

    const pastNoCertRegistration = {
      ...mockCourseRegistration,
      roundStatus: 'Past',
      certificateCreatedAt: null,
      certificateId: null,
    };

    // Mock meetPerson with 5 expected and 4 attended (missed 1, which is allowed) but no action plan
    const meetPersonNoActionPlan = {
      ...mockMeetPerson,
      expectedDiscussionsParticipant: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
      attendedDiscussions: ['disc-1', 'disc-2', 'disc-3', 'disc-4'],
      projectSubmission: null,
    };

    const mockExpectedDiscussions = {
      discussions: [
        {
          id: 'disc-1', startDateTime: 1000, endDateTime: 2000, unitNumber: 1,
        },
        {
          id: 'disc-2', startDateTime: 3000, endDateTime: 4000, unitNumber: 2,
        },
        {
          id: 'disc-3', startDateTime: 5000, endDateTime: 6000, unitNumber: 3,
        },
        {
          id: 'disc-4', startDateTime: 7000, endDateTime: 8000, unitNumber: 4,
        },
        {
          id: 'disc-5', startDateTime: 9000, endDateTime: 10000, unitNumber: 5,
        },
      ],
    };

    server.use(
      trpcMsw.meetPerson.getByCourseRegistrationId.query(() => meetPersonNoActionPlan),
      // @ts-expect-error
      trpcMsw.groupDiscussions.getByDiscussionIds.query(() => mockExpectedDiscussions),
    );

    render(
      <CourseListRow
        course={agiStrategyCourse}
        courseRegistration={pastNoCertRegistration}
        isFirst={false}
        isLast={false}
      />,
      { wrapper: TrpcProvider },
    );

    // Wait for the subtitle to appear (multiple elements due to responsive design)
    const subtitleTexts = await screen.findAllByText(/To receive a certificate you must submit your action plan/);
    expect(subtitleTexts.length).toBeGreaterThan(0);

    // Should also show the "Submit your action plan" button
    const actionPlanButtons = await screen.findAllByRole('link', { name: 'Submit your action plan' });
    expect(actionPlanButtons.length).toBeGreaterThan(0);
    expect(actionPlanButtons[0]).toHaveAttribute('href', expect.stringContaining('miniextensions.com'));
  });

  it('shows requirement message when course is "Past" with no cert: "Certificate pending" if there is no concrete reason', async () => {
    const pastNoCertRegistration = {
      ...mockCourseRegistration,
      roundStatus: 'Past',
      certificateCreatedAt: null,
      certificateId: null,
    };

    // Mock meetPerson with 5 expected and 4 attended (missed 1, which is allowed)
    const meetPersonAllMet = {
      ...mockMeetPerson,
      expectedDiscussionsParticipant: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
      attendedDiscussions: ['disc-1', 'disc-2', 'disc-3', 'disc-4'],
      projectSubmission: null, // Not required for this course (not agi-strategy)
    };

    const mockExpectedDiscussions = {
      discussions: [
        {
          id: 'disc-1', startDateTime: 1000, endDateTime: 2000, unitNumber: 1,
        },
        {
          id: 'disc-2', startDateTime: 3000, endDateTime: 4000, unitNumber: 2,
        },
        {
          id: 'disc-3', startDateTime: 5000, endDateTime: 6000, unitNumber: 3,
        },
        {
          id: 'disc-4', startDateTime: 7000, endDateTime: 8000, unitNumber: 4,
        },
        {
          id: 'disc-5', startDateTime: 9000, endDateTime: 10000, unitNumber: 5,
        },
      ],
    };

    server.use(
      trpcMsw.meetPerson.getByCourseRegistrationId.query(() => meetPersonAllMet),
      // @ts-expect-error
      trpcMsw.groupDiscussions.getByDiscussionIds.query(() => mockExpectedDiscussions),
    );

    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={pastNoCertRegistration}
        isFirst={false}
        isLast={false}
      />,
      { wrapper: TrpcProvider },
    );

    // Wait for the subtitle to appear (multiple elements due to responsive design)
    const subtitleTexts = await screen.findAllByText(/Certificate pending/);
    expect(subtitleTexts.length).toBeGreaterThan(0);
  });
});
