import '@testing-library/jest-dom';
import {
  fireEvent,
  render, screen, within,
} from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { TrpcProvider } from '../../__tests__/trpcProvider';
import GroupDiscussionBanner from './GroupDiscussionBanner';
import { createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';

// Mock dependencies
vi.mock('./GroupSwitchModal', () => ({
  default: () => <div data-testid="group-switch-modal">Group Switch Modal</div>,
}));

vi.mock('./FacilitatorSwitchModal', () => ({
  default: () => <div data-testid="facilitator-switch-modal">Facilitator Switch Modal</div>,
}));

Object.defineProperty(navigator, 'clipboard', {
  value: {
    writeText: vi.fn(),
  },
  writable: true,
});

const mockUnit = createMockUnit({ title: 'Introduction to AI Safety' });

const BASE_TIME = Math.floor(new Date('2024-09-25T10:00:00.000Z').getTime() / 1000);

const mockGroupDiscussion = createMockGroupDiscussion({
  facilitators: ['facilitator-1'],
  participantsExpected: ['participant-1'],
  startDateTime: BASE_TIME + 1800, // 30 minutes from base time
  endDateTime: BASE_TIME + 5400, // 90 minutes from base time
  zoomLink: 'https://zoom.us/j/123456789',
  activityDoc: 'https://docs.google.com/document/d/abc123',
  slackChannelId: 'C1234567890',
  unitRecord: { title: 'Introduction to AI Safety' },
});

describe('GroupDiscussionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // We restrict faking to just 'Date' to ensure deterministic tests for time-based logic.
    // We must NOT mock 'setTimeout' or 'setInterval'. tRPC relies  on native timers to batch updates and transition
    // states (loading -> success). If timers are mocked, the tRPC query will hang in 'loading' state indefinitely.
    vi.useFakeTimers({ toFake: ['Date'] });
    const fixedTime = new Date(BASE_TIME * 1000); // Convert back from seconds to milliseconds
    vi.setSystemTime(fixedTime);
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
        />,
        { wrapper: TrpcProvider },
      );

      expect(screen.getByText(/Discussion (in|is live)/)).toBeInTheDocument();
      const unitLink = screen.getByRole('link', { name: /Unit 1: Introduction to AI Safety/ });
      expect(unitLink).toBeInTheDocument();
      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      // Check desktop button container
      const desktopContainer = container.querySelector<HTMLElement>('#discussion-banner-desktop-container')!;
      expect(desktopContainer).toBeInTheDocument();
      const desktopButtons = within(desktopContainer);
      expect(desktopButtons.getByRole('link', { name: /Join now/ })).toBeInTheDocument();
      expect(desktopButtons.getByRole('link', { name: 'Open discussion doc' })).toBeInTheDocument();
      expect(desktopButtons.getByRole('link', { name: 'Message group' })).toBeInTheDocument();
      expect(desktopButtons.getByRole('button', { name: 'Can\'t make it?' })).toBeInTheDocument();
      // Participants have no overflow menu on desktop
      expect(desktopButtons.queryByRole('button', { name: 'More discussion options' })).not.toBeInTheDocument();

      // Check mobile button container - shows join-now, cant-make-it directly; rest in overflow
      const mobileContainer = container.querySelector<HTMLElement>('#discussion-banner-mobile-container')!;
      expect(mobileContainer).toBeInTheDocument();
      const mobileButtons = within(mobileContainer);
      expect(mobileButtons.getByRole('link', { name: /Join now/ })).toBeInTheDocument();
      expect(mobileButtons.getByRole('button', { name: 'Can\'t make it?' })).toBeInTheDocument();

      expect(container).toMatchSnapshot();
    });

    test('renders correctly for facilitator with host key', () => {
      const { container } = render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      // Desktop should have join-now, host-key, and discussion-doc directly; rest in overflow
      const desktopContainer = container.querySelector<HTMLElement>('#discussion-banner-desktop-container')!;
      const desktopButtons = within(desktopContainer);
      expect(desktopButtons.getByRole('link', { name: /Join now/ })).toBeInTheDocument();
      expect(desktopButtons.getByRole('button', { name: /Host key: 123456/ })).toBeInTheDocument();
      expect(desktopButtons.getByRole('link', { name: 'Open discussion doc' })).toBeInTheDocument();
      // Facilitators have overflow menu with additional options
      expect(desktopButtons.getByRole('button', { name: 'More discussion options' })).toBeInTheDocument();
      // Facilitators don't see "Can't make it?"
      expect(screen.queryByRole('button', { name: 'Can\'t make it?' })).not.toBeInTheDocument();

      // Mobile has join-now, host-key directly; rest in overflow
      const mobileContainer = container.querySelector<HTMLElement>('#discussion-banner-mobile-container')!;
      const mobileButtons = within(mobileContainer);
      expect(mobileButtons.getByRole('link', { name: /Join now/ })).toBeInTheDocument();
      expect(mobileButtons.getByRole('button', { name: /Host key: 123456/ })).toBeInTheDocument();

      expect(container).toMatchSnapshot();
    });
  });

  describe('User Interactions', () => {
    test('join discussion button has correct zoom link', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const joinButton = screen.getAllByText('Join now')[0]; // Get first instance (desktop or mobile)
      expect(joinButton!.closest('a')).toHaveAttribute('href', 'https://zoom.us/j/123456789');
      expect(joinButton!.closest('a')).toHaveAttribute('target', '_blank');
    });

    test('clicking host key button copies host key to clipboard', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const hostKeyButtons = screen.getAllByText('Host key: 123456');
      const hostKeyButton = hostKeyButtons[0]; // Get first instance (desktop or mobile)
      fireEvent.click(hostKeyButton!);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
    });

    test('unit title is a link with correct href', () => {
      const futureDiscussion = {
        ...mockGroupDiscussion,
        startDateTime: BASE_TIME + 7200, // 2 hours from base time
        endDateTime: BASE_TIME + 10800, // 3 hours from base time
      };

      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={futureDiscussion}
          userRole="participant"
        />,
        { wrapper: TrpcProvider },
      );

      const unitLink = screen.getByRole('link', { name: /Unit 1: Introduction to AI Safety/ });
      expect(unitLink).toHaveAttribute('href', `/courses/${mockUnit.courseSlug}/${mockUnit.unitNumber}/1`);
    });

    test('clicking "Can\'t make it?" opens group switch modal', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const cantMakeItButtons = screen.getAllByText('Can\'t make it?');
      const cantMakeItButton = cantMakeItButtons[0]; // Get first instance (desktop or mobile)
      fireEvent.click(cantMakeItButton!);

      expect(screen.getByTestId('group-switch-modal')).toBeInTheDocument();
    });

    test('open discussion doc button appears when discussion starts soon', () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const docButton = screen.getByText('Open discussion doc');
      expect(docButton.closest('a')).toHaveAttribute('href', 'https://docs.google.com/document/d/abc123');
    });
  });

  describe('User Role Specific Behavior', () => {
    test('facilitator can access "Change facilitator" from overflow menu', async () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      // Open overflow menu
      const overflowButton = screen.getAllByRole('button', { name: 'More discussion options' })[0];
      fireEvent.click(overflowButton!);

      // Click "Change facilitator" option
      const changeFacilitatorOption = await screen.findByText('Change facilitator');
      fireEvent.click(changeFacilitatorOption);

      expect(screen.getByTestId('facilitator-switch-modal')).toBeInTheDocument();
    });

    test('facilitator sees discussion doc button even when discussion is not starting soon', () => {
      const futureDiscussion = {
        ...mockGroupDiscussion,
        startDateTime: BASE_TIME + 7200, // 2 hours from base time
        endDateTime: BASE_TIME + 10800, // 3 hours from base time
      };

      const { container } = render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={futureDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = screen.getByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      // Facilitator-specific: Discussion doc button should be visible even when not starting soon
      const desktopContainer = container.querySelector<HTMLElement>('#discussion-banner-desktop-container')!;
      const desktopButtons = within(desktopContainer);
      expect(desktopButtons.getByRole('link', { name: 'Open discussion doc' })).toBeInTheDocument();

      expect(container).toMatchSnapshot();
    });
  });

  describe('Edge Cases', () => {
    test('shows fallback title when unitRecord is null', () => {
      const discussionWithoutUnit = {
        ...mockGroupDiscussion,
        courseBuilderUnitRecordId: null,
        unitRecord: null,
      };

      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={discussionWithoutUnit}
          userRole="participant"
        />,
        { wrapper: TrpcProvider },
      );

      // Should use fallback unit title when no unit record is provided
      expect(screen.getByText(/Unit 1/)).toBeInTheDocument();
    });
  });
});
