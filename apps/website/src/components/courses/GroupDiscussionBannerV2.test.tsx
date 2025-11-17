import '@testing-library/jest-dom';
import {
  fireEvent,
  render, screen, within,
} from '@testing-library/react';
import { TRPCError } from '@trpc/server';
import {
  afterEach,
  beforeEach,
  describe, expect, test, vi,
} from 'vitest';
import GroupDiscussionBannerV2 from './GroupDiscussionBannerV2';

// Mock dependencies
vi.mock('./GroupSwitchModal', () => ({
  default: () => <div data-testid="group-switch-modal">Group Switch Modal</div>,
}));

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

const mockUnit = {
  id: 'unit-123',
  title: 'Introduction to AI Safety',
  unitNumber: '1',
  courseSlug: 'ai-safety-fundamentals',
  path: '/courses/ai-safety-fundamentals/1',
  content: 'Unit content',
  description: 'Unit description',
  duration: 60,
  autoNumberId: 1,
  chunks: ['chunk-1'],
  courseId: 'course-123',
  courseTitle: 'AI Safety Fundamentals',
  coursePath: '/courses/ai-safety-fundamentals',
  learningOutcomes: 'Learning outcomes',
  menuText: 'Menu text',
  unitPodcastUrl: null,
  courseUnit: 'course-unit-123',
  unitStatus: 'active',
};

const BASE_TIME = Math.floor(new Date('2024-09-25T10:00:00.000Z').getTime() / 1000);

const mockGroupDiscussion = {
  id: 'discussion-123',
  facilitators: ['facilitator-1'],
  participantsExpected: ['participant-1'],
  attendees: [],
  startDateTime: BASE_TIME + 1800, // 30 minutes from base time
  endDateTime: BASE_TIME + 5400, // 90 minutes from base time
  group: 'group-123',
  zoomAccount: 'zoom-account-123',
  courseSite: 'site-123',
  unitNumber: 1,
  unit: 'unit-123',
  zoomLink: 'https://zoom.us/j/123456789',
  activityDoc: 'https://docs.google.com/document/d/abc123',
  slackChannelId: 'C1234567890',
  round: 'round-123',
  courseBuilderUnitRecordId: 'unit-123',
  autoNumberId: 1,
};

const { mockUseQuery } = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
}));

vi.mock('../../utils/trpc', () => ({
  trpc: {
    courses: {
      getUnit: {
        useQuery: mockUseQuery,
      },
    },
  },
}));

const mockOnClickPrepare = vi.fn();

describe('GroupDiscussionBannerV2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    const fixedTime = new Date(BASE_TIME * 1000); // Convert back from seconds to milliseconds
    vi.setSystemTime(fixedTime);

    mockUseQuery.mockReturnValue({
      data: mockUnit,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Happy Path Tests', () => {
    test('renders correctly for participant when discussion starts soon', () => {
      const { container } = render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      expect(screen.getByText(/Discussion (in|is live)/)).toBeInTheDocument();
      const unitButton = screen.getByRole('button', { name: /Unit 1: Introduction to AI Safety/ });
      expect(unitButton).toBeInTheDocument();
      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      // Check desktop button container
      const desktopContainer = container.querySelector('#discussion-banner-desktop-container') as HTMLElement;
      expect(desktopContainer).toBeInTheDocument();
      const desktopButtons = within(desktopContainer);
      expect(desktopButtons.getByRole('link', { name: /Join now/ })).toBeInTheDocument();
      expect(desktopButtons.getByRole('link', { name: 'Open discussion doc' })).toBeInTheDocument();
      expect(desktopButtons.getByRole('link', { name: 'Message group' })).toBeInTheDocument();
      expect(desktopButtons.getByRole('button', { name: "Can't make it?" })).toBeInTheDocument();

      // Check mobile button container
      const mobileContainer = container.querySelector('#discussion-banner-mobile-container') as HTMLElement;
      expect(mobileContainer).toBeInTheDocument();
      const mobileButtons = within(mobileContainer);
      expect(mobileButtons.getByRole('link', { name: /Join now/ })).toBeInTheDocument();
      expect(mobileButtons.getByRole('button', { name: "Can't make it?" })).toBeInTheDocument();

      expect(container).toMatchSnapshot();
    });

    test('renders correctly for facilitator with host key', () => {
      const { container } = render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      // Desktop and mobile should both have host key button
      const desktopContainer = container.querySelector('#discussion-banner-desktop-container') as HTMLElement;
      const desktopButtons = within(desktopContainer);
      expect(desktopButtons.getByRole('button', { name: 'Host key: 123456' })).toBeInTheDocument();
      const mobileContainer = container.querySelector('#discussion-banner-mobile-container') as HTMLElement;
      const mobileButtons = within(mobileContainer);
      expect(mobileButtons.getByRole('button', { name: 'Host key: 123456' })).toBeInTheDocument();

      // Group switch button shouldn't appear anywhere
      expect(screen.queryByRole('button', { name: "Can't make it?" })).not.toBeInTheDocument();

      expect(container).toMatchSnapshot();
    });
  });

  describe('User Interactions', () => {
    test('join discussion button has correct zoom link', () => {
      render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const joinButton = screen.getAllByText('Join now')[0]; // Get first instance (desktop or mobile)
      expect(joinButton!.closest('a')).toHaveAttribute('href', 'https://zoom.us/j/123456789');
      expect(joinButton!.closest('a')).toHaveAttribute('target', '_blank');
    });

    test('clicking host key button copies host key to clipboard', async () => {
      render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const hostKeyButtons = screen.getAllByText('Host key: 123456');
      const hostKeyButton = hostKeyButtons[0]; // Get first instance (desktop or mobile)
      fireEvent.click(hostKeyButton!);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
    });

    test('clicking unit title button calls onClickPrepare', () => {
      const futureDiscussion = {
        ...mockGroupDiscussion,
        startDateTime: BASE_TIME + 7200, // 2 hours from base time
        endDateTime: BASE_TIME + 10800, // 3 hours from base time
      };

      render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={futureDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const unitButton = screen.getByRole('button', { name: /Unit 1: Introduction to AI Safety/ });
      fireEvent.click(unitButton);

      expect(mockOnClickPrepare).toHaveBeenCalled();
    });

    test('clicking "Can\'t make it?" opens group switch modal', () => {
      render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const cantMakeItButtons = screen.getAllByText("Can't make it?");
      const cantMakeItButton = cantMakeItButtons[0]; // Get first instance (desktop or mobile)
      fireEvent.click(cantMakeItButton!);

      expect(screen.getByTestId('group-switch-modal')).toBeInTheDocument();
    });

    test('open discussion doc button appears when discussion starts soon', () => {
      render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const docButton = screen.getByText('Open discussion doc');
      expect(docButton.closest('a')).toHaveAttribute(
        'href',
        'https://docs.google.com/document/d/abc123',
      );
    });
  });

  describe('User Role Specific Behavior', () => {
    test('facilitator does not see "Can\'t make it?" button', () => {
      render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      expect(screen.queryByText("Can't make it?")).not.toBeInTheDocument();
    });
  });

  test('facilitator sees discussion doc button even when discussion is not starting soon', () => {
    const futureDiscussion = {
      ...mockGroupDiscussion,
      startDateTime: BASE_TIME + 7200, // 2 hours from base time
      endDateTime: BASE_TIME + 10800, // 3 hours from base time
    };

    const { container } = render(
      <GroupDiscussionBannerV2
        unit={mockUnit}
        groupDiscussion={futureDiscussion}
        userRole="facilitator"
        hostKeyForFacilitators="123456"
        onClickPrepare={mockOnClickPrepare}
      />,
    );

    const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
    fireEvent.click(expandButton);

    // Facilitator-specific: Discussion doc button should be visible even when not starting soon
    const desktopContainer = container.querySelector('#discussion-banner-desktop-container') as HTMLElement;
    const desktopButtons = within(desktopContainer);
    expect(desktopButtons.getByRole('link', { name: 'Open discussion doc' })).toBeInTheDocument();

    expect(container).toMatchSnapshot();
  });

  describe('Edge Cases', () => {
    test('handles unit fetch loading state', () => {
      mockUseQuery.mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      // Should use fallback unit title while loading
      expect(screen.getByText(/Unit 1/)).toBeInTheDocument();
    });

    test('shows fallback title when unit ID is missing', () => {
      const discussionWithoutUnit = {
        ...mockGroupDiscussion,
        courseBuilderUnitRecordId: null,
      };

      render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={discussionWithoutUnit}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      // Should use fallback unit title when no unit ID is provided
      expect(screen.getByText(/Unit 1/)).toBeInTheDocument();
    });

    test('handles unit fetch error state', () => {
      mockUseQuery.mockReturnValueOnce({
        data: undefined,
        isLoading: false,
        error: new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Server error' }),
      });

      render(
        <GroupDiscussionBannerV2
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      // Should use fallback unit title when error
      expect(screen.getByText(/Unit 1/)).toBeInTheDocument();
    });
  });
});
