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

  it('shows attendance count when course is "Past" with no cert', async () => {
    const pastNoCertRegistration = {
      ...mockCourseRegistration,
      roundStatus: 'Past',
      certificateCreatedAt: null,
      certificateId: null,
    };

    // Mock meetPerson with 5 units but only 2 attended
    const meetPersonLowAttendance = {
      ...mockMeetPerson,
      expectedDiscussionsParticipant: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
      attendedDiscussions: ['disc-1', 'disc-2'],
      uniqueDiscussionAttendance: 2,
      numUnits: 5,
      projectSubmission: null,
      courseFeedbackForm: 'https://example.com/feedback',
      courseFeedback: [],
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
      trpcMsw.meetPerson.getByCourseRegistrationId.query(() => meetPersonLowAttendance),
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
    const subtitleTexts = await screen.findAllByText(/You attended 2 out of 5 discussions/);
    expect(subtitleTexts.length).toBeGreaterThan(0);

    // Should show Share feedback button
    const feedbackButtons = await screen.findAllByRole('link', { name: 'Share feedback' });
    expect(feedbackButtons.length).toBeGreaterThan(0);
  });

  it('shows Submit action plan button for agi-strategy course without action plan', async () => {
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

    // Mock meetPerson with no action plan submitted
    const meetPersonNoActionPlan = {
      ...mockMeetPerson,
      expectedDiscussionsParticipant: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
      attendedDiscussions: ['disc-1', 'disc-2', 'disc-3', 'disc-4'],
      uniqueDiscussionAttendance: 4,
      numUnits: 5,
      projectSubmission: null,
      courseFeedbackForm: 'https://example.com/feedback',
      courseFeedback: [],
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

    // Wait for the subtitle showing attendance count
    const subtitleTexts = await screen.findAllByText(/You attended 4 out of 5 discussions/);
    expect(subtitleTexts.length).toBeGreaterThan(0);

    // Should show the "Submit action plan" button
    const actionPlanButtons = await screen.findAllByRole('link', { name: 'Submit action plan' });
    expect(actionPlanButtons.length).toBeGreaterThan(0);
    expect(actionPlanButtons[0]).toHaveAttribute('href', expect.stringContaining('miniextensions.com'));

    // Should also show Share feedback button
    const feedbackButtons = await screen.findAllByRole('link', { name: 'Share feedback' });
    expect(feedbackButtons.length).toBeGreaterThan(0);
  });

  it('shows Action plan submitted button when action plan is submitted for agi-strategy course', async () => {
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

    // Mock meetPerson with action plan submitted
    const meetPersonWithActionPlan = {
      ...mockMeetPerson,
      expectedDiscussionsParticipant: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
      attendedDiscussions: ['disc-1', 'disc-2', 'disc-3', 'disc-4'],
      uniqueDiscussionAttendance: 4,
      numUnits: 5,
      projectSubmission: ['action-plan-record-1'],
      courseFeedbackForm: 'https://example.com/feedback',
      courseFeedback: [],
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
      trpcMsw.meetPerson.getByCourseRegistrationId.query(() => meetPersonWithActionPlan),
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

    // Wait for the subtitle showing attendance count
    const subtitleTexts = await screen.findAllByText(/You attended 4 out of 5 discussions/);
    expect(subtitleTexts.length).toBeGreaterThan(0);

    // Should show disabled "Action plan submitted" button
    const actionPlanSubmittedButtons = await screen.findAllByRole('button', { name: /Action plan submitted/ });
    expect(actionPlanSubmittedButtons.length).toBeGreaterThan(0);

    // Should also show Share feedback button
    const feedbackButtons = await screen.findAllByRole('link', { name: 'Share feedback' });
    expect(feedbackButtons.length).toBeGreaterThan(0);
  });

  it('shows locked certificate button when certificate exists but feedback not submitted', async () => {
    const completedRegistration = {
      ...mockCourseRegistration,
      roundStatus: 'Past',
      certificateCreatedAt: new Date('2024-01-01').getTime() / 1000,
      certificateId: 'cert-123',
    };

    // Mock meetPerson with certificate but no feedback submitted
    const meetPersonNoFeedback = {
      ...mockMeetPerson,
      uniqueDiscussionAttendance: 5,
      numUnits: 5,
      courseFeedbackForm: 'https://example.com/feedback',
      courseFeedback: [], // No feedback submitted
    };

    server.use(
      trpcMsw.meetPerson.getByCourseRegistrationId.query(() => meetPersonNoFeedback),
    );

    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={completedRegistration}
        isFirst={false}
        isLast={false}
      />,
      { wrapper: TrpcProvider },
    );

    // Should show locked certificate button
    const lockedCertButtons = await screen.findAllByRole('link', { name: /Share feedback to view your certificate/ });
    expect(lockedCertButtons.length).toBeGreaterThan(0);
    expect(lockedCertButtons[0]).toHaveAttribute('href', 'https://example.com/feedback');
  });

  it('shows View your certificate button when certificate exists and feedback submitted', async () => {
    const completedRegistration = {
      ...mockCourseRegistration,
      roundStatus: 'Past',
      certificateCreatedAt: new Date('2024-01-01').getTime() / 1000,
      certificateId: 'cert-123',
    };

    // Mock meetPerson with certificate AND feedback submitted
    const meetPersonWithFeedback = {
      ...mockMeetPerson,
      uniqueDiscussionAttendance: 5,
      numUnits: 5,
      courseFeedbackForm: 'https://example.com/feedback',
      courseFeedback: ['feedback-record-1'], // Feedback submitted
    };

    server.use(
      trpcMsw.meetPerson.getByCourseRegistrationId.query(() => meetPersonWithFeedback),
    );

    render(
      <CourseListRow
        course={mockCourse}
        courseRegistration={completedRegistration}
        isFirst={false}
        isLast={false}
      />,
      { wrapper: TrpcProvider },
    );

    // Should show View your certificate button (not locked)
    const certificateButtons = await screen.findAllByRole('link', { name: 'View your certificate' });
    expect(certificateButtons.length).toBeGreaterThan(0);
    expect(certificateButtons[0]).toHaveAttribute('href', '/certification?id=cert-123');
  });
});
