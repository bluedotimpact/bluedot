import {
  describe, test, expect, vi,
} from 'vitest';
import {
  render, screen, fireEvent, waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { createMockGroupDiscussion } from '../../__tests__/testUtils';
import DiscussionListRow from './DiscussionListRow';
import * as downloadModule from '../../lib/downloadCalendarFile';

const discussion = createMockGroupDiscussion({
  id: 'disc-1',
  unitNumber: 4,
  zoomLink: 'https://zoom.us/j/000',
});

const unit = {
  unitNumber: '4',
  title: 'Detecting danger',
} as unknown as Unit;

const renderRow = (overrides: Partial<React.ComponentProps<typeof DiscussionListRow>> = {}) => render(<ul>
  <DiscussionListRow
    discussion={discussion}
    unit={unit}
    courseSlug="technical-ai-safety"
    status="upcoming"
    canReschedule
    onReschedule={() => {}}
    {...overrides}
  />
</ul>);

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
      // No overflow-variant items → desktop overflow menu doesn't render at all.
      expect(container.querySelector('.sm\\:flex button[aria-label="Discussion actions"]')).toBeNull();
    });
  });

  describe('no duplicate items across inline + desktop overflow (regression)', () => {
    // For each state, an action label rendered inline should NOT also appear in the desktop
    // overflow menu (and vice-versa). Mobile overflow legitimately mirrors inline content (since
    // the inline row is CSS-hidden at narrow widths), so it's excluded from this check.
    const statesUnderTest: { status: React.ComponentProps<typeof DiscussionListRow>['status']; canReschedule: boolean }[] = [
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
      const noZoom = { ...discussion, zoomLink: null } as GroupDiscussion;
      renderRow({ status: 'live', discussion: noZoom });
      expect(screen.queryByRole('link', { name: 'Join now' })).toBeNull();
    });
  });

  test('title falls back to "Discussion" plain text when unit and unitNumber are missing', () => {
    const noUnitDiscussion = { ...discussion, unitNumber: null } as GroupDiscussion;
    const { container } = renderRow({ unit: null, discussion: noUnitDiscussion });
    // Title is rendered as text, not as a link, when there's no unit number to link to.
    expect(screen.getByText('Discussion').tagName).toBe('P');
    expect(container.querySelector('a[href^="/courses/"]')).toBeNull();
  });

  test('renders download-error alert when the calendar download throws', async () => {
    vi.spyOn(downloadModule, 'downloadDiscussionCalendarFile').mockRejectedValueOnce(new Error('boom'));

    const { container } = renderRow({ status: 'upcoming' });
    const overflowButton = container.querySelector('.sm\\:flex button[aria-label="Discussion actions"]') as HTMLButtonElement;
    fireEvent.click(overflowButton);
    const downloadItem = Array.from(document.querySelectorAll('[role="menuitem"]'))
      .find((i) => i.textContent?.trim() === 'Download calendar file') as HTMLElement;
    fireEvent.click(downloadItem);

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toMatch(/Could not download/i);
    });
  });
});
