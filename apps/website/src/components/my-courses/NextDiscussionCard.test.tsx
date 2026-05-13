import { render, screen } from '@testing-library/react';
import {
  afterEach, beforeEach, describe, expect, test, vi,
} from 'vitest';
import { createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';
import NextDiscussionCard from './NextDiscussionCard';

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

  test('shows the soon eyebrow text and keeps Prep for discussion when starting within an hour', () => {
    const discussion = createMockGroupDiscussion({
      startDateTime: NOW_SEC + 16 * 60,
      endDateTime: NOW_SEC + 16 * 60 + ONE_HOUR_SECS,
    });
    render(<NextDiscussionCard {...baseProps} discussion={discussion} />);
    expect(screen.getByText('Starts in 16 minutes')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Prep for discussion' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Join discussion' })).toBeNull();
  });

  test('swaps Prep for Join discussion when the discussion is live', () => {
    const discussion = createMockGroupDiscussion({
      startDateTime: NOW_SEC - 10 * 60,
      endDateTime: NOW_SEC + 50 * 60,
      zoomLink: 'https://zoom.us/j/abc',
    });
    render(<NextDiscussionCard {...baseProps} discussion={discussion} />);
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
});
