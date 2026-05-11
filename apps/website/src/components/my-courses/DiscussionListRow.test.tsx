import {
  describe, test, expect, vi,
} from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import type { GroupDiscussion, Unit } from '@bluedot/db';
import { createMockGroupDiscussion } from '../../__tests__/testUtils';
import DiscussionListRow from './DiscussionListRow';

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
    test('shows on upcoming', () => {
      const { container } = renderRow({ status: 'upcoming' });
      const labels = openOverflowAndGetLabels(container, 'desktop');
      expect(labels).toContain('Download calendar file');
    });

    test('shows on soon', () => {
      const { container } = renderRow({ status: 'soon' });
      const labels = openOverflowAndGetLabels(container, 'desktop');
      expect(labels).toContain('Download calendar file');
    });

    test('shows on live', () => {
      const { container } = renderRow({ status: 'live' });
      const labels = openOverflowAndGetLabels(container, 'desktop');
      expect(labels).toContain('Download calendar file');
    });

    test('hidden on attended (past event, calendar file is stale)', () => {
      const { container } = renderRow({ status: 'attended' });
      const desktopOverflow = container.querySelectorAll('button[aria-label="Discussion actions"]')[0];
      // Desktop overflow shouldn't render at all when there are no overflow-variant items.
      expect(desktopOverflow).toBeUndefined();
    });

    test('hidden on absent (past event, calendar file is stale)', () => {
      const { container } = renderRow({ status: 'absent', canReschedule: false });
      const desktopOverflow = container.querySelectorAll('button[aria-label="Discussion actions"]')[0];
      expect(desktopOverflow).toBeUndefined();
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

    test('hidden on soon (only flips on live per design)', () => {
      renderRow({ status: 'soon' });
      expect(screen.queryByRole('link', { name: 'Join now' })).toBeNull();
    });
  });

  test('calls onReschedule when Reschedule is clicked', () => {
    const onReschedule = vi.fn();
    renderRow({ status: 'upcoming', onReschedule });
    const button = screen.getAllByRole('button', { name: 'Reschedule' })[0]!;
    fireEvent.click(button);
    expect(onReschedule).toHaveBeenCalledOnce();
  });
});
