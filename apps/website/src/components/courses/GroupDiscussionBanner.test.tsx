import '@testing-library/jest-dom';
import {
  fireEvent,
  render, screen,
} from '@testing-library/react';
import { TRPCError } from '@trpc/server';
import {
  afterEach,
  beforeEach,
  describe, expect, test, vi,
} from 'vitest';
import GroupDiscussionBanner from './GroupDiscussionBanner';

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

describe('GroupDiscussionBanner', () => {
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
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      expect(screen.getByText(/Your discussion on/)).toBeInTheDocument();
      expect(screen.getByText(/Unit 1: Introduction to AI Safety/)).toBeInTheDocument();
      expect(screen.getByText('Join discussion')).toBeInTheDocument();
      expect(screen.getByText('Message your group')).toBeInTheDocument();
      expect(screen.getByText("Can't make it?")).toBeInTheDocument();
      expect(container).toMatchSnapshot();
    });

    test('renders correctly for facilitator with host key', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      expect(screen.getByText('Join discussion (Host key: 123456)')).toBeInTheDocument();
      expect(screen.queryByText("Can't make it?")).not.toBeInTheDocument();
    });

    test('facilitator sees discussion doc button even when discussion is not starting soon', () => {
      const futureDiscussion = {
        ...mockGroupDiscussion,
        startDateTime: BASE_TIME + 7200, // 2 hours from base time
      };

      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={futureDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      expect(screen.getByText('Open discussion doc')).toBeInTheDocument();
      expect(screen.getByText('Prepare for discussion')).toBeInTheDocument();
      expect(screen.queryByText('Join discussion')).not.toBeInTheDocument();
    });

    test('renders prepare button when discussion is not starting soon', () => {
      const futureDiscussion = {
        ...mockGroupDiscussion,
        startDateTime: BASE_TIME + 7200, // 2 hours from base time
      };

      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={futureDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      expect(screen.getByText('Prepare for discussion')).toBeInTheDocument();
      expect(screen.queryByText('Join discussion')).not.toBeInTheDocument();
      expect(screen.queryByText('Open discussion doc')).not.toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('join discussion button has correct zoom link', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const joinButton = screen.getByText('Join discussion');
      expect(joinButton.closest('a')).toHaveAttribute('href', 'https://zoom.us/j/123456789');
      expect(joinButton.closest('a')).toHaveAttribute('target', '_blank');
    });

    test('clicking join discussion as facilitator copies host key to clipboard', async () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const joinButton = screen.getByText('Join discussion (Host key: 123456)');
      fireEvent.click(joinButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
    });

    test('clicking prepare button calls onClickPrepare', () => {
      const futureDiscussion = {
        ...mockGroupDiscussion,
        startDateTime: BASE_TIME + 7200, // 2 hours from base time
      };

      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={futureDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const prepareButton = screen.getByText('Prepare for discussion');
      fireEvent.click(prepareButton);

      expect(mockOnClickPrepare).toHaveBeenCalled();
    });

    test('clicking "Can\'t make it?" opens group switch modal', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      const cantMakeItButton = screen.getByText("Can't make it?");
      fireEvent.click(cantMakeItButton);

      expect(screen.getByTestId('group-switch-modal')).toBeInTheDocument();
    });

    test('open discussion doc button appears when discussion starts soon', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

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
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      expect(screen.queryByText("Can't make it?")).not.toBeInTheDocument();
    });

    test('participant sees normal join button text', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      expect(screen.getByText('Join discussion')).toBeInTheDocument();
      expect(screen.queryByText(/Host key:/)).not.toBeInTheDocument();
    });

    test('facilitator without host key shows normal join button', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          onClickPrepare={mockOnClickPrepare}
        />,
      );

      expect(screen.getByText('Join discussion')).toBeInTheDocument();
      expect(screen.queryByText(/Host key:/)).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles unit fetch loading state', () => {
      mockUseQuery.mockReturnValueOnce({
        data: undefined,
        isLoading: true,
        error: null,
      });

      render(
        <GroupDiscussionBanner
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
        <GroupDiscussionBanner
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
        <GroupDiscussionBanner
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
