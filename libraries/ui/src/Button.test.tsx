import {
  describe, expect, test,
  vi,
} from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  test('renders a primary medium button by default', () => {
    render(<Button>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button.className).includes('bg-accent');
    expect(button.className).includes('h-11');
    expect(button).toMatchSnapshot();
  });

  test('renders as a link when url is provided, even with onClick', () => {
    render(<Button url="https://example.com" onClick={() => vi.fn()} variant="secondary">Click me</Button>);
    const link = screen.getByRole('link');
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('https://example.com');
    expect(link.className).includes('border-accent');
  });

  test.each([
    ['ghost', 'text-secondary'],
    ['black', 'bg-dark'],
    ['outline-black', 'border-strong'],
  ] as const)('%s variant uses its token', (variant, token) => {
    render(<Button variant={variant}>Click me</Button>);
    expect(screen.getByRole('button').className).includes(token);
  });

  test('unstyled variant adds no colour classes', () => {
    render(<Button variant="unstyled">Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.className).not.toMatch(/\bbg-|\btext-(accent|on-dark|primary|secondary)|\bborder-/);
  });

  test.each([
    ['small', 'h-9'],
    ['medium', 'h-11'],
    ['large', 'h-[50px]'],
  ] as const)('%s size sets the height', (size, height) => {
    render(<Button size={size}>Click me</Button>);
    const button = screen.getByRole('button');
    expect(button.className).includes(height);
    expect(button.className).includes('text-size-xs');
    expect(button.className).includes('font-semibold');
  });

  describe('tone', () => {
    test('destructive primary swaps the fill', () => {
      render(<Button tone="destructive">Delete</Button>);
      const button = screen.getByRole('button');
      expect(button.className).includes('bg-error-fg');
      expect(button.className).not.includes('bg-accent ');
      expect(button.className).includes('text-on-dark');
    });

    test('success secondary swaps border and text, keeps the outline chrome', () => {
      render(<Button variant="secondary" tone="success">Keep</Button>);
      const button = screen.getByRole('button');
      expect(button.className).includes('border-success-fg');
      expect(button.className).includes('text-success-fg');
      expect(button.className).includes('hover:bg-success-bg');
      expect(button.className).not.includes('text-accent');
    });

    test('is ignored by variants without a tone recipe', () => {
      render(<Button variant="ghost" tone="warning">Hmm</Button>);
      expect(screen.getByRole('button').className).not.includes('warning');
    });
  });

  describe('loading', () => {
    test('marks the button busy, shows dots and keeps the label', () => {
      render(<Button loading>Saving…</Button>);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.hasAttribute('disabled')).toBe(false);
      expect(button.textContent).toBe('Saving…');
      expect(button.querySelector('[aria-hidden]')).toBeTruthy();
      expect(screen.queryByRole('status')).toBeNull();
    });

    test('ignores activation while busy', () => {
      const onClick = vi.fn();
      render(<Button loading onClick={onClick}>Saving…</Button>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    test('dims like disabled while busy', () => {
      render(<Button loading>Saving…</Button>);
      expect(screen.getByRole('button').className).includes('aria-busy:opacity-50');
    });
  });

  // Regression test for the tailwind-merge bug Greptile flagged on the PR that
  // introduced `size="large"`: callers passing a `text-{color}` className were
  // silently dropping `text-size-*` from the size config because `text-size-*`
  // wasn't registered as a font-size class group. The fix lives in `cn()`.
  test('keeps its font-size when caller adds a text colour class', () => {
    render(<Button variant="unstyled" size="large" className="text-bluedot-navy">
      Click me
    </Button>);
    const button = screen.getByRole('button');
    expect(button.className).includes('text-size-xs');
    expect(button.className).includes('text-bluedot-navy');
  });
});
