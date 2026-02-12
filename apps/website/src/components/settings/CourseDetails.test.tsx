import '@testing-library/jest-dom';
import {
  act, render, screen, waitFor,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createMockCourse,
  createMockCourseRegistration,
  createMockGroup,
  createMockGroupDiscussion,
  createMockUnit,
} from '../../__tests__/testUtils';
import CourseDetails from './CourseDetails';

// Mock GroupSwitchModal to avoid testing it here
vi.mock('../courses/GroupSwitchModal', () => ({
  default: ({ initialUnitNumber, initialSwitchType, handleClose }: { initialUnitNumber?: string; initialSwitchType?: string; handleClose: () => void }) => (
    <div data-testid="group-switch-modal">
      <div>Group Switch Modal{initialUnitNumber ? ` - Unit ${initialUnitNumber}` : ''}</div>
      <div>Switch type: {initialSwitchType}</div>
      <button type="button" onClick={handleClose}>Close Modal</button>
    </div>
  ),
}));

describe('CourseDetails', () => {
  const mockCourse = createMockCourse({
    id: 'course-1',
    title: 'Introduction to AI Safety',
    description: 'Learn the fundamentals of AI safety and alignment.',
    durationDescription: '8 weeks',
    path: '/courses/ai-safety',
    slug: 'ai-safety',
    level: 'Beginner',
  });

  const mockCourseRegistration = createMockCourseRegistration({
    courseId: 'course-1',
  });

  it('displays expanded course details region', async () => {
    render(<CourseDetails
      course={mockCourse}
      courseRegistration={mockCourseRegistration}
      upcomingDiscussions={[]}
      attendedDiscussions={[]}
      facilitatedDiscussions={[]}
      isLoading={false}
    />);

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

describe('CourseDetails: Participant view', () => {
  // GIVEN
  const mockCourse = createMockCourse({
    id: 'course-1',
    title: 'Introduction to AI Safety',
    slug: 'ai-safety',
  });

  const mockCourseRegistration = createMockCourseRegistration({
    courseId: 'course-1',
    role: 'Participant',
  });

  it('displays unit title from unitFallback when unitRecord is missing', async () => {
    const currentTimeMs = Date.now();

    // WHEN: A discussion has no unitRecord but has unitFallback
    const upcomingDiscussions = [
      {
        ...createMockGroupDiscussion({
          unitNumber: 3,
          startDateTime: Math.floor(currentTimeMs / 1000) + 2 * 60 * 60,
          endDateTime: Math.floor(currentTimeMs / 1000) + 3 * 60 * 60,
        }),
        unitRecord: null, // No unit record
        unitFallback: '3: Advanced Concepts',
        groupDetails: createMockGroup(),
      },
    ];

    render(<CourseDetails
      course={mockCourse}
      courseRegistration={mockCourseRegistration}
      upcomingDiscussions={upcomingDiscussions}
      attendedDiscussions={[]}
      facilitatedDiscussions={[]}
      isLoading={false}
    />);

    // THEN: The unit title is displayed using the fallback field
    await waitFor(() => {
      expect(screen.getByText('Unit 3: Advanced Concepts')).toBeInTheDocument();
    });
  });

  it('links to the course content when the next upcoming discussion is far in the future', async () => {
    const currentTimeMs = Date.now();

    // WHEN: There are multiple upcoming discussions, all >1 hour away
    const upcomingDiscussions = [
      {
        ...createMockGroupDiscussion({
          unitNumber: 3,
          startDateTime: Math.floor(currentTimeMs / 1000) + 2 * 60 * 60, // 2 hours from now
          endDateTime: Math.floor(currentTimeMs / 1000) + 3 * 60 * 60,
        }),
        unitRecord: createMockUnit({ unitNumber: '3', title: 'Advanced Concepts' }),
        groupDetails: createMockGroup(),
      },
      {
        ...createMockGroupDiscussion({
          unitNumber: 4,
          startDateTime: Math.floor(currentTimeMs / 1000) + 7 * 24 * 60 * 60, // 7 days from now
          endDateTime: Math.floor(currentTimeMs / 1000) + 7 * 24 * 60 * 60 + 60 * 60,
        }),
        unitRecord: createMockUnit({ unitNumber: '4', title: 'Expert Topics' }),
        groupDetails: createMockGroup(),
      },
    ];

    render(<CourseDetails
      course={mockCourse}
      courseRegistration={mockCourseRegistration}
      upcomingDiscussions={upcomingDiscussions}
      attendedDiscussions={[]}
      facilitatedDiscussions={[]}
      isLoading={false}
    />);

    // THEN: The "Prepare for discussion" button is rendered for the first discussion
    await waitFor(() => {
      const prepareButton = screen.getByRole('link', { name: 'Prepare for discussion' });
      expect(prepareButton).toBeInTheDocument();
      expect(prepareButton).toHaveAttribute('href', '/courses/ai-safety/3');
    });
  });

  it('links to the zoom meeting when the next upcoming discussion is starting soon', async () => {
    const currentTimeMs = Date.now();

    // WHEN: The first discussion starts in <1 hour (starting soon)
    const upcomingDiscussions = [
      {
        ...createMockGroupDiscussion({
          unitNumber: 2,
          startDateTime: Math.floor(currentTimeMs / 1000) + 30 * 60, // 30 minutes from now
          endDateTime: Math.floor(currentTimeMs / 1000) + 90 * 60, // 90 minutes from now
          zoomLink: 'https://zoom.us/j/123456789?pwd=abc123',
        }),
        unitRecord: createMockUnit({ unitNumber: '2', title: 'Key Concepts' }),
        groupDetails: createMockGroup(),
      },
      {
        ...createMockGroupDiscussion({
          unitNumber: 3,
          startDateTime: Math.floor(currentTimeMs / 1000) + 7 * 24 * 60 * 60, // 7 days from now
          endDateTime: Math.floor(currentTimeMs / 1000) + 7 * 24 * 60 * 60 + 60 * 60,
        }),
        unitRecord: createMockUnit({ unitNumber: '3', title: 'Advanced Topics' }),
        groupDetails: createMockGroup(),
      },
    ];

    render(<CourseDetails
      course={mockCourse}
      courseRegistration={mockCourseRegistration}
      upcomingDiscussions={upcomingDiscussions}
      attendedDiscussions={[]}
      facilitatedDiscussions={[]}
      isLoading={false}
    />);

    // THEN: The "Join now" button is rendered for the first discussion
    await waitFor(() => {
      const joinButton = screen.getByRole('link', { name: 'Join now' });
      expect(joinButton).toBeInTheDocument();
      expect(joinButton).toHaveAttribute('href', 'https://zoom.us/j/123456789?pwd=abc123');
      expect(joinButton).toHaveAttribute('target', '_blank');
    });
  });

  it('opens group switch modal with correct unit when clicking "Can\'t make it?" for different discussions', async () => {
    const user = userEvent.setup();
    const currentTimeMs = Date.now();

    // WHEN: There are multiple upcoming discussions
    const upcomingDiscussions = [
      {
        ...createMockGroupDiscussion({
          id: 'discussion-5',
          unitNumber: 5,
          startDateTime: Math.floor(currentTimeMs / 1000) + 2 * 60 * 60, // 2 hours from now
          endDateTime: Math.floor(currentTimeMs / 1000) + 3 * 60 * 60,
        }),
        unitRecord: createMockUnit({ unitNumber: '5', title: 'Unit Five' }),
        groupDetails: createMockGroup(),
      },
      {
        ...createMockGroupDiscussion({
          id: 'discussion-7',
          unitNumber: 6,
          startDateTime: Math.floor(currentTimeMs / 1000) + 7 * 24 * 60 * 60, // 7 days from now
          endDateTime: Math.floor(currentTimeMs / 1000) + 7 * 24 * 60 * 60 + 60 * 60,
        }),
        unitRecord: createMockUnit({ unitNumber: '6', title: 'Unit Six' }),
        groupDetails: createMockGroup(),
      },
    ];

    render(<CourseDetails
      course={mockCourse}
      courseRegistration={mockCourseRegistration}
      upcomingDiscussions={upcomingDiscussions}
      attendedDiscussions={[]}
      facilitatedDiscussions={[]}
      isLoading={false}
    />);

    // THEN: Clicking "Can't make it?" on the first discussion opens modal with Unit 5
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Prepare for discussion' })).toBeInTheDocument();
    });

    const cantMakeItUnit5 = screen.getByRole('button', { name: 'Switch group for Unit 5' });
    await act(async () => {
      await user.click(cantMakeItUnit5);
    });

    expect(screen.getByTestId('group-switch-modal')).toBeInTheDocument();
    expect(screen.getByText('Group Switch Modal - Unit 5')).toBeInTheDocument();

    // Close the modal
    const closeButton = screen.getByRole('button', { name: 'Close Modal' });
    await act(async () => {
      await user.click(closeButton);
    });

    expect(screen.queryByTestId('group-switch-modal')).not.toBeInTheDocument();

    // THEN: Clicking "Can't make it?" on the second discussion opens modal with Unit 6
    const cantMakeItUnit6 = screen.getByRole('button', { name: 'Switch group for Unit 6' });
    await act(async () => {
      await user.click(cantMakeItUnit6);
    });

    expect(screen.getByTestId('group-switch-modal')).toBeInTheDocument();
    expect(screen.getByText('Group Switch Modal - Unit 6')).toBeInTheDocument();
  });

  it('displays overflow menu with all expected items and links for upcoming discussions', async () => {
    const user = userEvent.setup();
    const currentTimeMs = Date.now();

    // WHEN: There are upcoming discussions with Slack channels
    const upcomingDiscussions = [
      {
        ...createMockGroupDiscussion({
          id: 'discussion-3',
          unitNumber: 3,
          startDateTime: Math.floor(currentTimeMs / 1000) + 2 * 60 * 60, // 2 hours from now
          endDateTime: Math.floor(currentTimeMs / 1000) + 3 * 60 * 60,
          slackChannelId: 'C1234567890',
        }),
        unitRecord: createMockUnit({ unitNumber: '3', title: 'Unit Three' }),
        groupDetails: createMockGroup(),
      },
    ];

    render(<CourseDetails
      course={mockCourse}
      courseRegistration={mockCourseRegistration}
      upcomingDiscussions={upcomingDiscussions}
      attendedDiscussions={[]}
      facilitatedDiscussions={[]}
      isLoading={false}
    />);

    // THEN: The overflow menu button exists
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Prepare for discussion' })).toBeInTheDocument();
    });

    const overflowButton = screen.getByRole('button', { name: 'More actions' });
    expect(overflowButton).toBeInTheDocument();

    // Click to open the overflow menu
    await act(async () => {
      await user.click(overflowButton);
    });

    // THEN: All overflow items are present with expected links
    const messageGroupLink = screen.getByRole('menuitem', { name: 'Message group' });
    expect(messageGroupLink).toBeInTheDocument();
    expect(messageGroupLink).toHaveAttribute('href', 'https://app.slack.com/client/T01K0M15NEQ/C1234567890');
    expect(messageGroupLink).toHaveAttribute('target', '_blank');

    const switchGroupPermanently = screen.getByRole('menuitem', { name: 'Switch group permanently' });
    expect(switchGroupPermanently).toBeInTheDocument();
    // This one should not have an href since it opens a modal
    expect(switchGroupPermanently).not.toHaveAttribute('href');

    // Click "Switch group permanently" to verify it opens modal WITHOUT initial unit number
    await act(async () => {
      await user.click(switchGroupPermanently);
    });

    const modal = screen.getByTestId('group-switch-modal');
    expect(modal).toBeInTheDocument();
    // Should NOT have a unit number for "Switch group permanently"
    expect(modal).not.toHaveTextContent(/Unit \d/);
    expect(screen.getByText('Switch type: Switch group permanently')).toBeInTheDocument();
  });

  it('shows NOW/LIVE indicators and "Open discussion doc" menu item when discussion is live', async () => {
    const user = userEvent.setup();
    const currentTimeMs = Date.now();

    // WHEN: A discussion is currently live (started but not yet ended)
    const upcomingDiscussions = [
      {
        ...createMockGroupDiscussion({
          id: 'discussion-live',
          unitNumber: 2,
          startDateTime: Math.floor(currentTimeMs / 1000) - 10 * 60, // Started 10 minutes ago
          endDateTime: Math.floor(currentTimeMs / 1000) + 50 * 60, // Ends in 50 minutes
          slackChannelId: 'C1234567890',
          activityDoc: 'https://docs.google.com/document/d/abc123',
          zoomLink: 'https://zoom.us/j/123456789?pwd=abc123',
        }),
        unitRecord: createMockUnit({ unitNumber: '2', title: 'Unit Two' }),
        groupDetails: createMockGroup(),
      },
    ];

    render(<CourseDetails
      course={mockCourse}
      courseRegistration={mockCourseRegistration}
      upcomingDiscussions={upcomingDiscussions}
      attendedDiscussions={[]}
      facilitatedDiscussions={[]}
      isLoading={false}
    />);

    // THEN: The NOW and LIVE indicators should be visible
    await waitFor(() => {
      expect(screen.getByText('NOW')).toBeInTheDocument();
      expect(screen.getByText('LIVE')).toBeInTheDocument();
    });

    // THEN: Open the overflow menu
    const overflowButton = screen.getByRole('button', { name: 'More actions' });
    expect(overflowButton).toBeInTheDocument();

    await act(async () => {
      await user.click(overflowButton);
    });

    // THEN: "Open discussion doc" should be present in the overflow menu
    const discussionDocLink = screen.getByRole('menuitem', { name: 'Open discussion doc' });
    expect(discussionDocLink).toBeInTheDocument();
    expect(discussionDocLink).toHaveAttribute('href', 'https://docs.google.com/document/d/abc123');
    expect(discussionDocLink).toHaveAttribute('target', '_blank');
  });
});

describe('CourseDetails: Facilitator view', () => {
  // GIVEN
  const mockCourse = createMockCourse({
    id: 'course-1',
    title: 'Introduction to AI Safety',
    slug: 'ai-safety',
  });

  const mockCourseRegistration = createMockCourseRegistration({
    courseId: 'course-1',
    role: 'Facilitator',
  });

  it('does not show "Can\'t make it?" or "Switch group permanently" buttons, but overflow items still work', async () => {
    const user = userEvent.setup();
    const currentTimeMs = Date.now();

    // WHEN: There are upcoming discussions with Slack channels
    const upcomingDiscussions = [
      {
        ...createMockGroupDiscussion({
          id: 'discussion-4',
          unitNumber: 4,
          startDateTime: Math.floor(currentTimeMs / 1000) + 2 * 60 * 60, // 2 hours from now
          endDateTime: Math.floor(currentTimeMs / 1000) + 3 * 60 * 60,
          slackChannelId: 'C9876543210',
        }),
        unitRecord: createMockUnit({ unitNumber: '4', title: 'Unit Four' }),
        groupDetails: createMockGroup(),
      },
    ];

    render(<CourseDetails
      course={mockCourse}
      courseRegistration={mockCourseRegistration}
      upcomingDiscussions={upcomingDiscussions}
      attendedDiscussions={[]}
      facilitatedDiscussions={[]}
      isLoading={false}
    />);

    // THEN: The "Can't make it?" button should NOT appear for facilitators
    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Prepare for discussion' })).toBeInTheDocument();
    });

    expect(screen.queryByRole('button', { name: /Switch group for Unit/ })).not.toBeInTheDocument();
    expect(screen.queryByText('Can\'t make it?')).not.toBeInTheDocument();

    // THEN: The overflow menu should exist and work
    const overflowButton = screen.getByRole('button', { name: 'More actions' });
    expect(overflowButton).toBeInTheDocument();

    // Click to open the overflow menu
    await act(async () => {
      await user.click(overflowButton);
    });

    // THEN: "Message group" should be present
    const messageGroupLink = screen.getByRole('menuitem', { name: 'Message group' });
    expect(messageGroupLink).toBeInTheDocument();
    expect(messageGroupLink).toHaveAttribute('href', 'https://app.slack.com/client/T01K0M15NEQ/C9876543210');
    expect(messageGroupLink).toHaveAttribute('target', '_blank');

    // THEN: "Switch group permanently" should NOT appear for facilitators
    expect(screen.queryByRole('menuitem', { name: 'Switch group permanently' })).not.toBeInTheDocument();
  });

  it('shows Facilitated discussions tab with count when facilitatedDiscussions has items', async () => {
    const currentTimeMs = Date.now();
    const facilitatedDiscussions = [{
      ...createMockGroupDiscussion({
        startDateTime: Math.floor(currentTimeMs / 1000) - 7 * 24 * 60 * 60,
        endDateTime: Math.floor(currentTimeMs / 1000) - 7 * 24 * 60 * 60 + 60 * 60,
      }),
      unitRecord: createMockUnit({ unitNumber: '1', title: 'Unit One' }),
      groupDetails: createMockGroup(),
    }];

    render(<CourseDetails
      course={mockCourse}
      courseRegistration={createMockCourseRegistration({ courseId: 'course-1', role: 'Facilitator', roundStatus: 'Past' })}
      upcomingDiscussions={[]}
      attendedDiscussions={[]}
      facilitatedDiscussions={facilitatedDiscussions}
      isLoading={false}
    />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Facilitated discussions' })).toBeInTheDocument();
    });
  });
});
