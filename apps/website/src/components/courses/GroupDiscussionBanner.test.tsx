import '@testing-library/jest-dom';
import {
  fireEvent,
  render, screen, within,
} from '@testing-library/react';
import { TRPCError } from '@trpc/server';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
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
});

const mockOnClickPrepare = vi.fn();

describe('GroupDiscussionBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // We restrict faking to just 'Date' to ensure deterministic tests for time-based logic.
    // We must NOT mock 'setTimeout' or 'setInterval'. tRPC relies  on native timers to batch updates and transition
    // states (loading -> success). If timers are mocked, the tRPC query will hang in 'loading' state indefinitely.
    vi.useFakeTimers({ toFake: ['Date'] });
    const fixedTime = new Date(BASE_TIME * 1000); // Convert back from seconds to milliseconds
    vi.setSystemTime(fixedTime);

    server.use(trpcMsw.courses.getUnit.query(() => mockUnit));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('Happy Path Tests', () => {
    test('renders correctly for participant when discussion starts soon', async () => {
      const { container } = render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      expect(screen.getByText(/Discussion (in|is live)/)).toBeInTheDocument();
      // Wait for component to fetch data (loading to finish)
      const unitButton = await screen.findByRole('button', { name: /Unit 1: Introduction to AI Safety/ });
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

    test('renders correctly for facilitator with host key', async () => {
      const { container } = render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = await screen.findByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      // Desktop should have host key button and "Can't make it?" for facilitator switching
      const desktopContainer = container.querySelector('#discussion-banner-desktop-container') as HTMLElement;
      const desktopButtons = within(desktopContainer);
      expect(desktopButtons.getByRole('button', { name: 'Host key: 123456' })).toBeInTheDocument();
      expect(desktopButtons.getByRole('button', { name: "Can't make it?" })).toBeInTheDocument();

      // Mobile has host key in overflow menu, so just check "Can't make it?" is visible
      const mobileContainer = container.querySelector('#discussion-banner-mobile-container') as HTMLElement;
      const mobileButtons = within(mobileContainer);
      expect(mobileButtons.getByRole('button', { name: "Can't make it?" })).toBeInTheDocument();

      expect(container).toMatchSnapshot();
    });
  });

  describe('User Interactions', () => {
    test('join discussion button has correct zoom link', async () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = await screen.findByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const joinButton = screen.getAllByText('Join now')[0]; // Get first instance (desktop or mobile)
      expect(joinButton!.closest('a')).toHaveAttribute('href', 'https://zoom.us/j/123456789');
      expect(joinButton!.closest('a')).toHaveAttribute('target', '_blank');
    });

    test('clicking host key button copies host key to clipboard', async () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = await screen.findByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const hostKeyButtons = screen.getAllByText('Host key: 123456');
      const hostKeyButton = hostKeyButtons[0]; // Get first instance (desktop or mobile)
      fireEvent.click(hostKeyButton!);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('123456');
    });

    test('clicking unit title button calls onClickPrepare', async () => {
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
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      const unitButton = await screen.findByRole('button', { name: /Unit 1: Introduction to AI Safety/ });
      fireEvent.click(unitButton);

      expect(mockOnClickPrepare).toHaveBeenCalled();
    });

    test('clicking "Can\'t make it?" opens group switch modal', async () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = await screen.findByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const cantMakeItButtons = screen.getAllByText("Can't make it?");
      const cantMakeItButton = cantMakeItButtons[0]; // Get first instance (desktop or mobile)
      fireEvent.click(cantMakeItButton!);

      expect(screen.getByTestId('group-switch-modal')).toBeInTheDocument();
    });

    test('open discussion doc button appears when discussion starts soon', async () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = await screen.findByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const docButton = screen.getByText('Open discussion doc');
      expect(docButton.closest('a')).toHaveAttribute('href', 'https://docs.google.com/document/d/abc123');
    });
  });

  describe('User Role Specific Behavior', () => {
    test('facilitator clicking "Can\'t make it?" opens facilitator switch modal', async () => {
      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="facilitator"
          hostKeyForFacilitators="123456"
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = await screen.findByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      const cantMakeItButtons = screen.getAllByText("Can't make it?");
      fireEvent.click(cantMakeItButtons[0]!);

      expect(screen.getByTestId('facilitator-switch-modal')).toBeInTheDocument();
    });

    test('facilitator sees discussion doc button even when discussion is not starting soon', async () => {
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
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      const expandButton = await screen.findByRole('button', { name: 'Expand upcoming discussion banner' });
      fireEvent.click(expandButton);

      // Facilitator-specific: Discussion doc button should be visible even when not starting soon
      const desktopContainer = container.querySelector('#discussion-banner-desktop-container') as HTMLElement;
      const desktopButtons = within(desktopContainer);
      expect(desktopButtons.getByRole('link', { name: 'Open discussion doc' })).toBeInTheDocument();

      expect(container).toMatchSnapshot();
    });
  });

  describe('Edge Cases', () => {
    test('handles unit fetch loading state', () => {
      server.use(
        trpcMsw.courses.getUnit.query(() => {
          return new Promise(() => {}); // Never resolves to simulate loading
        }),
      );

      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      // Should use fallback unit title while loading
      expect(screen.getByText(/Unit 1/)).toBeInTheDocument();
    });

    test('shows fallback title when unit ID is missing', async () => {
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
        { wrapper: TrpcProvider },
      );

      // Should use fallback unit title when no unit ID is provided
      expect(await screen.findByText(/Unit 1/)).toBeInTheDocument();
    });

    test('handles unit fetch error state', async () => {
      server.use(
        trpcMsw.courses.getUnit.query(() => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Server error' });
        }),
      );

      render(
        <GroupDiscussionBanner
          unit={mockUnit}
          groupDiscussion={mockGroupDiscussion}
          userRole="participant"
          onClickPrepare={mockOnClickPrepare}
        />,
        { wrapper: TrpcProvider },
      );

      // Should use fallback unit title when error
      expect(await screen.findByText(/Unit 1/)).toBeInTheDocument();
    });
  });
});
