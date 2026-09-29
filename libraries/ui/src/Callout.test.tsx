import {
  describe, expect, test, vi,
} from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Callout } from './Callout';

describe('Callout', () => {
  test('renders title, body and a decorative tone icon, with no live-region role by default', () => {
    const { container } = render(<Callout tone="warning" title="Heads up">Body copy</Callout>);
    expect(screen.getByText('Heads up')).toBeTruthy();
    expect(screen.getByText('Body copy')).toBeTruthy();
    expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(container.firstElementChild?.getAttribute('role')).toBeNull();
  });

  test('passes native attributes through to the root', () => {
    render(<Callout role="alert" data-testid="callout">Save failed</Callout>);
    expect(screen.getByRole('alert').getAttribute('data-testid')).toBe('callout');
  });

  test('renders onClick actions as buttons and url actions as links', () => {
    const onClick = vi.fn();
    render(<Callout actions={[{ label: 'Rejoin', onClick }, { label: 'Learn more', emphasis: 'secondary', url: '/about' }]}>Body</Callout>);
    fireEvent.click(screen.getByRole('button', { name: 'Rejoin' }));
    expect(onClick).toHaveBeenCalledOnce();
    expect(screen.getByRole('link', { name: 'Learn more' }).getAttribute('href')).toBe('/about');
  });

  test('renders a Dismiss button only when onDismiss is given', () => {
    const { rerender } = render(<Callout>Body</Callout>);
    expect(screen.queryByRole('button', { name: 'Dismiss' })).toBeNull();

    const onDismiss = vi.fn();
    rerender(<Callout onDismiss={onDismiss}>Body</Callout>);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    expect(onDismiss).toHaveBeenCalledOnce();
  });

  test('allows actions and dismissal together', () => {
    render(<Callout actions={[{ label: 'Quick apply', url: '/apply' }]} onDismiss={() => {}}>Body</Callout>);
    expect(screen.getByRole('link', { name: 'Quick apply' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Dismiss' })).toBeTruthy();
  });
});
