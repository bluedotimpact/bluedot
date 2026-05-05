import { fireEvent, render, screen } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import NextDiscussionCard from './NextDiscussionCard';

const baseProps = {
  month: 'Apr',
  day: 28,
  title: 'Detecting danger',
  datetimeLabel: 'April 28, 2026, 4:00 - 5:00 PM',
  primaryHref: '/courses/technical-ai-safety/3/1',
} as const;

describe('NextDiscussionCard', () => {
  test('shows Prep for discussion in the next state', () => {
    render(<NextDiscussionCard {...baseProps} state="next" eyebrow="UNIT 3" />);
    expect(screen.getByText('Detecting danger')).toBeDefined();
    expect(screen.getByText('UNIT 3')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Prep for discussion' })).toBeDefined();
    expect(screen.queryByRole('link', { name: 'Join discussion' })).toBeNull();
  });

  test('shows the soon eyebrow text', () => {
    render(<NextDiscussionCard {...baseProps} state="soon" eyebrow="Starts in 16 minutes" />);
    expect(screen.getByText('Starts in 16 minutes')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Prep for discussion' })).toBeDefined();
  });

  test('swaps Prep for Join discussion in the live state', () => {
    render(<NextDiscussionCard {...baseProps} state="live" eyebrow="LIVE" primaryHref="https://zoom.us/j/abc" />);
    const join = screen.getByRole('link', { name: 'Join discussion' });
    expect(join.getAttribute('href')).toBe('https://zoom.us/j/abc');
    expect(join.getAttribute('target')).toBe('_blank');
    expect(screen.queryByRole('link', { name: 'Prep for discussion' })).toBeNull();
  });

  test('fires onReschedule when Reschedule clicked', () => {
    const onReschedule = vi.fn();
    render(<NextDiscussionCard {...baseProps} state="next" eyebrow="UNIT 3" onReschedule={onReschedule} />);
    fireEvent.click(screen.getByRole('button', { name: 'Reschedule' }));
    expect(onReschedule).toHaveBeenCalledOnce();
  });
});
