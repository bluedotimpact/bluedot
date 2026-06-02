import { fireEvent, render, screen } from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import type { Group } from '@bluedot/db';
import { createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';
import NextDiscussionCard from './NextDiscussionCard';

vi.mock('../courses/FacilitatorSwitchModal', () => ({
  default: () => <div data-testid="facilitator-switch-modal">Facilitator Switch Modal</div>,
}));

const NOW = new Date('2026-04-28T15:00:00Z').getTime();
const ONE_HOUR_SECS = 60 * 60;
const NOW_SEC = Math.floor(NOW / 1000);

const unit = createMockUnit({ unitNumber: '3', title: 'Detecting danger' });
const baseProps = {
  courseSlug: 'technical-ai-safety',
  courseTitle: 'Technical AI Safety',
  unit,
} as const;

describe('NextDiscussionCard', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('shows Prep for discussion when the discussion is more than an hour away', () => {
    const discussion = createMockGroupDiscussion({
      startDateTime: NOW_SEC + 26 * ONE_HOUR_SECS,
      endDateTime: NOW_SEC + 27 * ONE_HOUR_SECS,
    });
    render(<NextDiscussionCard {...baseProps} discussion={discussion} />);
    expect(screen.getByText('Detecting danger')).toBeDefined();
    expect(screen.getByText('TECHNICAL AI SAFETY: UNIT 3')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Prep for discussion' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Join discussion' })).toBeNull();
  });

  test('a soon discussion reads as a normal upcoming one (no "starting soon" state)', () => {
    const discussion = createMockGroupDiscussion({
      startDateTime: NOW_SEC + 16 * 60,
      endDateTime: NOW_SEC + 16 * 60 + ONE_HOUR_SECS,
    });
    render(<NextDiscussionCard {...baseProps} discussion={discussion} />);
    expect(screen.getByText('TECHNICAL AI SAFETY: UNIT 3')).toBeDefined();
    expect(screen.queryByText(/Starts in/)).toBeNull();
    expect(screen.getByRole('link', { name: 'Prep for discussion' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Join discussion' })).toBeNull();
  });

  test('keeps the course name in the eyebrow and swaps Prep for Join when live', () => {
    const discussion = createMockGroupDiscussion({
      startDateTime: NOW_SEC - 10 * 60,
      endDateTime: NOW_SEC + 50 * 60,
      zoomLink: 'https://zoom.us/j/abc',
    });
    render(<NextDiscussionCard {...baseProps} discussion={discussion} />);
    // Course name stays visible when live (the live cue moves to the left graphic).
    expect(screen.getByText('TECHNICAL AI SAFETY: UNIT 3')).toBeDefined();
    const join = screen.getByRole('link', { name: 'Join discussion' });
    expect(join.getAttribute('href')).toBe('https://zoom.us/j/abc');
    expect(join.getAttribute('target')).toBe('_blank');
    expect(screen.queryByRole('link', { name: 'Prep for discussion' })).toBeNull();
  });

  test('hides Reschedule when the discussion has no round attached', () => {
    const discussion = createMockGroupDiscussion({
      startDateTime: NOW_SEC + 26 * ONE_HOUR_SECS,
      endDateTime: NOW_SEC + 27 * ONE_HOUR_SECS,
      round: null,
    });
    render(<NextDiscussionCard {...baseProps} discussion={discussion} />);
    expect(screen.queryByRole('button', { name: 'Reschedule' })).toBeNull();
  });

  describe('facilitator mode', () => {
    const group = { id: 'group-9', discussionDoc: 'https://example.com/doc' } as Group;
    const facilitatorProps = {
      ...baseProps, mode: 'facilitator' as const, group, facilitatorSubtitle: 'Week 18 Group 9',
    };

    test('shows "Update discussion time" after "Open discussion doc"', () => {
      const discussion = createMockGroupDiscussion({
        startDateTime: NOW_SEC + 26 * ONE_HOUR_SECS,
        endDateTime: NOW_SEC + 27 * ONE_HOUR_SECS,
      });
      const { container } = render(<NextDiscussionCard {...facilitatorProps} discussion={discussion} />);
      expect(screen.getByRole('link', { name: 'Open discussion doc' })).toBeDefined();
      expect(screen.getByRole('button', { name: 'Update discussion time' })).toBeDefined();
      const text = container.textContent ?? '';
      expect(text.indexOf('Open discussion doc')).toBeLessThan(text.indexOf('Update discussion time'));
    });

    test('clicking "Update discussion time" opens the facilitator switch modal', () => {
      const discussion = createMockGroupDiscussion({
        startDateTime: NOW_SEC + 26 * ONE_HOUR_SECS,
        endDateTime: NOW_SEC + 27 * ONE_HOUR_SECS,
      });
      render(<NextDiscussionCard {...facilitatorProps} discussion={discussion} />);
      fireEvent.click(screen.getByRole('button', { name: 'Update discussion time' }));
      expect(screen.getByTestId('facilitator-switch-modal')).toBeDefined();
    });

    test('hides "Update discussion time" when the discussion is live (to keep the button count down)', () => {
      const discussion = createMockGroupDiscussion({
        startDateTime: NOW_SEC - 10 * 60,
        endDateTime: NOW_SEC + 50 * 60,
        zoomLink: 'https://zoom.us/j/abc',
      });
      render(<NextDiscussionCard {...facilitatorProps} discussion={discussion} />);
      expect(screen.getByRole('link', { name: 'Open discussion doc' })).toBeDefined();
      expect(screen.getByRole('link', { name: 'Join discussion' })).toBeDefined();
      expect(screen.queryByRole('button', { name: 'Update discussion time' })).toBeNull();
    });

    test('disables "Update discussion time" (rather than hiding it) when the discussion has no round attached', () => {
      const discussion = createMockGroupDiscussion({
        startDateTime: NOW_SEC + 26 * ONE_HOUR_SECS,
        endDateTime: NOW_SEC + 27 * ONE_HOUR_SECS,
        round: null,
      });
      render(<NextDiscussionCard {...facilitatorProps} discussion={discussion} />);
      const button = screen.getByRole('button', { name: 'Update discussion time' });
      expect(button.hasAttribute('disabled')).toBe(true);
    });
  });
});
