import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { createMockGroupDiscussion } from '../../__tests__/testUtils';
import DiscussionListRow from './DiscussionListRow';
import * as downloadModule from '../../lib/downloadCalendarFile';

const NOW = new Date('2026-04-28T15:00:00Z').getTime();
const NOW_SEC = Math.floor(NOW / 1000);
const HOUR = 60 * 60;

type DisplayStatus = 'upcoming' | 'soon' | 'live' | 'attended' | 'absent';

const baseDiscussion = createMockGroupDiscussion({
  id: 'disc-1',
  unitNumber: 4,
  zoomLink: 'https://zoom.us/j/000',
});

const unit = {
  unitNumber: '4',
  title: 'Detecting danger',
} as unknown as Unit;

/**
 * Translate the legacy `status` test fixture into the discussion/isAttended shape the row
 * now takes. Each case picks start/end relative to a fixed fake-now so the row's internal
 * time-state derivation lands on the desired branch.
 */
const propsForStatus = (
  status: DisplayStatus,
  discussion: GroupDiscussion = baseDiscussion,
): { discussion: GroupDiscussion; isAttended: boolean } => {
  switch (status) {
    case 'upcoming':
      return { discussion: { ...discussion, startDateTime: NOW_SEC + 2 * HOUR, endDateTime: NOW_SEC + 3 * HOUR }, isAttended: false };
    case 'soon':
      return { discussion: { ...discussion, startDateTime: NOW_SEC + 10 * 60, endDateTime: NOW_SEC + 70 * 60 }, isAttended: false };
    case 'live':
      return { discussion: { ...discussion, startDateTime: NOW_SEC - 10 * 60, endDateTime: NOW_SEC + 50 * 60 }, isAttended: false };
    case 'attended':
      return { discussion: { ...discussion, startDateTime: NOW_SEC - 2 * HOUR, endDateTime: NOW_SEC - HOUR }, isAttended: true };
    case 'absent':
    default:
      return { discussion: { ...discussion, startDateTime: NOW_SEC - 2 * HOUR, endDateTime: NOW_SEC - HOUR }, isAttended: false };
  }
};

const renderRow = ({
  status = 'upcoming',
  discussion = baseDiscussion,
  ...overrides
}: {
  status?: DisplayStatus;
  discussion?: GroupDiscussion;
  unit?: Unit | null;
  canReschedule?: boolean;
  onReschedule?: () => void;
} = {}) => {
  const statusProps = propsForStatus(status, discussion);
  return render(<ul>
    <DiscussionListRow
      unit={unit}
      courseSlug="technical-ai-safety"
      canReschedule
      onReschedule={() => {}}
      {...statusProps}
      {...overrides}
    />
  </ul>);
};

/** Open the overflow menu inside the given viewport's container (the `hidden sm:flex` div for
 *  desktop, the `sm:hidden` div for mobile) and return its menu item labels. Returns [] when
 *  the OverflowMenu for that viewport isn't rendered (i.e. no items to surface). */
const openOverflowAndGetLabels = (container: HTMLElement, instance: 'desktop' | 'mobile'): string[] => {
  const scopeSelector = instance === 'desktop' ? '.sm\\:flex' : '.sm\\:hidden';
  const scope = container.querySelector(scopeSelector);
  const button = scope?.querySelector('button[aria-label="Discussion actions"]') as HTMLButtonElement | null;
  if (!button) return [];
  fireEvent.click(button);
  const items = Array.from(document.querySelectorAll('[role="menuitem"]'));
  return items.map((i) => i.textContent?.trim() ?? '');
};

describe('DiscussionListRow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Download calendar file visibility (regression: should NOT show on past states)', () => {
    test.each(['upcoming', 'soon', 'live'] as const)('shows on %s', (status) => {
      const { container } = renderRow({ status });
      expect(openOverflowAndGetLabels(container, 'desktop')).toContain('Download calendar file');
    });

    test.each([
      { status: 'attended' as const, canReschedule: true },
      { status: 'absent' as const, canReschedule: false },
    ])('hidden on $status (past event, calendar file is stale)', ({ status, canReschedule }) => {
      const { container } = renderRow({ status, canReschedule });
      // No overflow-variant items -> desktop overflow menu doesn't render at all.
      expect(container.querySelector('.sm\\:flex button[aria-label="Discussion actions"]')).toBeNull();
    });
  });

  describe('no duplicate items across inline + desktop overflow (regression)', () => {
    // For each state, an action label rendered inline should NOT also appear in the desktop
    // overflow menu (and vice-versa). Mobile overflow legitimately mirrors inline content (since
    // the inline row is CSS-hidden at narrow widths), so it's excluded from this check.
    const statesUnderTest: { status: DisplayStatus; canReschedule: boolean }[] = [
      { status: 'upcoming', canReschedule: true },
      { status: 'soon', canReschedule: true },
      { status: 'live', canReschedule: true },
      { status: 'attended', canReschedule: true },
      { status: 'absent', canReschedule: true },
      { status: 'absent', canReschedule: false },
    ];

    test.each(statesUnderTest)('no overlap between inline buttons and desktop overflow ($status, canReschedule=$canReschedule)', ({ status, canReschedule }) => {
      const { container } = renderRow({ status, canReschedule });
      const inlineContainer = container.querySelector('.sm\\:flex');
      const inlineLabels = inlineContainer
        ? Array.from(inlineContainer.querySelectorAll('a, button'))
          .filter((el) => el.getAttribute('aria-label') !== 'Discussion actions')
          .map((el) => el.textContent?.trim() ?? '')
          .filter(Boolean)
        : [];
      const overflowLabels = openOverflowAndGetLabels(container, 'desktop');
      const overlap = inlineLabels.filter((l) => overflowLabels.includes(l));
      expect(overlap).toEqual([]);
    });
  });

  describe('Reschedule visibility on absent', () => {
    test('shows when canReschedule=true', () => {
      renderRow({ status: 'absent', canReschedule: true });
      expect(screen.getAllByRole('button', { name: 'Reschedule' }).length).toBeGreaterThan(0);
    });

    test('hidden when canReschedule=false', () => {
      renderRow({ status: 'absent', canReschedule: false });
      expect(screen.queryByRole('button', { name: 'Reschedule' })).toBeNull();
    });
  });

  describe('Join now visibility', () => {
    test('shows on live with zoomLink', () => {
      renderRow({ status: 'live' });
      expect(screen.getAllByRole('link', { name: 'Join now' }).length).toBeGreaterThan(0);
    });

    test('hidden on live without zoomLink', () => {
      const noZoom = { ...baseDiscussion, zoomLink: null } as GroupDiscussion;
      renderRow({ status: 'live', discussion: noZoom });
      expect(screen.queryByRole('link', { name: 'Join now' })).toBeNull();
    });
  });

  test('title falls back to "Discussion" plain text when unit and unitNumber are missing', () => {
    const noUnitDiscussion = { ...baseDiscussion, unitNumber: null } as GroupDiscussion;
    const { container } = renderRow({ unit: null, discussion: noUnitDiscussion });
    // Title is rendered as text, not as a link, when there's no unit number to link to.
    expect(screen.getByText('Discussion').tagName).toBe('P');
    expect(container.querySelector('a[href^="/courses/"]')).toBeNull();
  });

  test('renders download-error alert when the calendar download throws', async () => {
    // This test needs real timers for waitFor to resolve promise microtasks. We construct
    // the discussion's start/end relative to real "now" so the row still reads as upcoming.
    vi.useRealTimers();
    vi.spyOn(downloadModule, 'downloadDiscussionCalendarFile').mockRejectedValueOnce(new Error('boom'));

    const realNowSec = Math.floor(Date.now() / 1000);
    const upcomingDiscussion = {
      ...baseDiscussion,
      startDateTime: realNowSec + 2 * HOUR,
      endDateTime: realNowSec + 3 * HOUR,
    };
    const { container } = render(<ul>
      <DiscussionListRow
        discussion={upcomingDiscussion}
        unit={unit}
        courseSlug="technical-ai-safety"
        isAttended={false}
        canReschedule
        onReschedule={() => {}}
      />
    </ul>);

    const overflowButton = container.querySelector('.sm\\:flex button[aria-label="Discussion actions"]')!;
    fireEvent.click(overflowButton);
    const downloadItem = Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find((i) => i.textContent?.trim() === 'Download calendar file') as HTMLElement;
    fireEvent.click(downloadItem);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toMatch(/Could not download/i);
    });
  });

  describe('facilitator mode', () => {
    const withAttendees = (n: number): GroupDiscussion => ({
      ...baseDiscussion,
      participantsExpected: Array.from({ length: n }, (_, i) => `p-${i}`),
    });

    const renderFacRow = ({
      status = 'upcoming',
      discussion = baseDiscussion,
      onClickFacilitatorReschedule = () => {},
      onClickFacilitatorAssignSubstitute = () => {},
      onClickViewAttendees = () => {},
    }: {
      status?: DisplayStatus;
      discussion?: GroupDiscussion;
      onClickFacilitatorReschedule?: (d: GroupDiscussion) => void;
      onClickFacilitatorAssignSubstitute?: (d: GroupDiscussion) => void;
      onClickViewAttendees?: () => void;
    } = {}) => {
      const statusProps = propsForStatus(status, discussion);
      return render(<ul>
        <DiscussionListRow
          mode="facilitator"
          unit={unit}
          courseSlug="technical-ai-safety"
          canReschedule
          onReschedule={() => {}}
          onClickFacilitatorReschedule={onClickFacilitatorReschedule}
          onClickFacilitatorAssignSubstitute={onClickFacilitatorAssignSubstitute}
          onClickViewAttendees={onClickViewAttendees}
          {...statusProps}
        />
      </ul>);
    };

    const clickOverflowItem = (container: HTMLElement, label: string) => {
      const button = container.querySelector('.sm\\:flex button[aria-label="Discussion actions"]')!;
      fireEvent.click(button);
      const item = Array.from(document.querySelectorAll('[role="menuitem"]'))
        .find((i) => i.textContent?.trim() === label) as HTMLElement;
      fireEvent.click(item);
    };

    test('upcoming: shows the "{N} Attending" pill and the facilitator overflow items', () => {
      const { container } = renderFacRow({ status: 'upcoming', discussion: withAttendees(3) });
      expect(screen.getByText('3 Attending')).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Join now' })).toBeNull();
      expect(openOverflowAndGetLabels(container, 'desktop')).toEqual(expect.arrayContaining(['View attendees', 'Reschedule', 'Change facilitator', 'Download calendar file']));
    });

    test('live: shows "Join now" and hides the Attending pill', () => {
      // baseDiscussion has a zoomLink
      renderFacRow({ status: 'live' });
      expect(screen.getAllByRole('link', { name: 'Join now' }).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Attending/)).toBeNull();
    });

    test('live without a zoom link: no "Join now" link', () => {
      const noZoom = { ...baseDiscussion, zoomLink: null } as GroupDiscussion;
      renderFacRow({ status: 'live', discussion: noZoom });
      expect(screen.queryByRole('link', { name: 'Join now' })).toBeNull();
    });

    test('past: shows the "Facilitated" pill; overflow keeps "View attendees" but drops the mutating actions', () => {
      const { container } = renderFacRow({ status: 'attended' });
      expect(screen.getByText('Facilitated')).toBeInTheDocument();
      const items = openOverflowAndGetLabels(container, 'desktop');
      expect(items).toContain('View attendees');
      expect(items).not.toContain('Reschedule');
      expect(items).not.toContain('Change facilitator');
      expect(items).not.toContain('Download calendar file');
    });

    test('overflow items invoke their callbacks (one-off reschedule + substitute pass the discussion)', () => {
      const onClickViewAttendees = vi.fn();
      const onClickFacilitatorReschedule = vi.fn();
      const onClickFacilitatorAssignSubstitute = vi.fn();
      const { container } = renderFacRow({
        status: 'upcoming',
        onClickViewAttendees,
        onClickFacilitatorReschedule,
        onClickFacilitatorAssignSubstitute,
      });

      clickOverflowItem(container, 'View attendees');
      expect(onClickViewAttendees).toHaveBeenCalledTimes(1);

      clickOverflowItem(container, 'Reschedule');
      expect(onClickFacilitatorReschedule).toHaveBeenCalledTimes(1);
      expect(onClickFacilitatorReschedule.mock.calls[0][0].id).toBe(baseDiscussion.id);

      clickOverflowItem(container, 'Change facilitator');
      expect(onClickFacilitatorAssignSubstitute).toHaveBeenCalledTimes(1);
      expect(onClickFacilitatorAssignSubstitute.mock.calls[0][0].id).toBe(baseDiscussion.id);
    });
  });
});
