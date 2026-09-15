import { describe, expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressDots } from './ProgressDots';

describe('ProgressDots', () => {
  test('announces loading via a status region', () => {
    render(<ProgressDots />);

    const status = screen.getByRole('status');
    expect(status.textContent).toBe('Loading…');
    expect(screen.getByText('Loading…').className).toContain('sr-only');
  });

  test('hides the decorative dots from assistive technology', () => {
    render(<ProgressDots />);

    const dots = screen.getByRole('status').querySelectorAll('[aria-hidden="true"]');
    expect(dots).toHaveLength(3);
  });

  test('bounces only when motion is allowed, pulses otherwise', () => {
    render(<ProgressDots />);

    screen.getByRole('status').querySelectorAll('[aria-hidden="true"]').forEach((dot) => {
      expect(dot.className).toContain('motion-safe:animate-bounce');
      expect(dot.className).toContain('motion-reduce:animate-pulse');
      expect(dot.className).not.toMatch(/(^|\s)animate-bounce/);
    });
  });

  test('dots inherit colour from the wrapper', () => {
    render(<ProgressDots className="text-on-dark" />);

    const status = screen.getByRole('status');
    expect(status.className).toContain('text-on-dark');
    status.querySelectorAll('[aria-hidden="true"]').forEach((dot) => {
      expect(dot.className).toContain('bg-current');
    });
  });
});
