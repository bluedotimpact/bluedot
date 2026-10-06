import {
  describe, expect, test,
  vi,
} from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { CTALinkOrButton } from './CTALinkOrButton';

describe('CTALinkOrButton', () => {
  test('renders a primary medium button by default', () => {
    render(<CTALinkOrButton>Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button.tagName).toBe('BUTTON');
    expect(button.className).includes('bg-accent');
    expect(button.className).includes('h-11');
    expect(button).toMatchSnapshot();
  });

  test('renders as a link when url is provided, even with onClick', () => {
    render(<CTALinkOrButton url="https://example.com" onClick={() => vi.fn()} variant="secondary">Click me</CTALinkOrButton>);
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
    render(<CTALinkOrButton variant={variant}>Click me</CTALinkOrButton>);
    expect(screen.getByRole('button').className).includes(token);
  });

  test('unstyled variant adds no colour classes', () => {
    render(<CTALinkOrButton variant="unstyled">Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button.className).not.toMatch(/\bbg-|\btext-(accent|on-dark|primary|secondary)|\bborder-/);
  });

  test.each([
    ['small', 'h-9'],
    ['medium', 'h-11'],
    ['large', 'h-[50px]'],
  ] as const)('%s size sets the height', (size, height) => {
    render(<CTALinkOrButton size={size}>Click me</CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button.className).includes(height);
    expect(button.className).includes('text-size-xs');
    expect(button.className).includes('font-semibold');
  });

  describe('tone', () => {
    test('destructive primary swaps the fill', () => {
      render(<CTALinkOrButton tone="destructive">Delete</CTALinkOrButton>);
      const button = screen.getByRole('button');
      expect(button.className).includes('bg-error-fg');
      expect(button.className).not.includes('bg-accent ');
      expect(button.className).includes('text-on-dark');
    });

    test('success secondary swaps border and text, keeps the outline chrome', () => {
      render(<CTALinkOrButton variant="secondary" tone="success">Keep</CTALinkOrButton>);
      const button = screen.getByRole('button');
      expect(button.className).includes('border-success-fg');
      expect(button.className).includes('text-success-fg');
      expect(button.className).includes('hover:bg-success-bg');
      expect(button.className).not.includes('text-accent');
    });

    test('is ignored by variants without a tone recipe', () => {
      render(<CTALinkOrButton variant="ghost" tone="warning">Hmm</CTALinkOrButton>);
      expect(screen.getByRole('button').className).not.includes('warning');
    });
  });

  describe('loading', () => {
    test('marks the button busy, shows dots and keeps the label', () => {
      render(<CTALinkOrButton loading>Saving…</CTALinkOrButton>);
      const button = screen.getByRole('button');
      expect(button.getAttribute('aria-busy')).toBe('true');
      expect(button.hasAttribute('disabled')).toBe(false);
      expect(button.textContent).toBe('Saving…');
      expect(button.querySelector('[aria-hidden]')).toBeTruthy();
      expect(screen.queryByRole('status')).toBeNull();
    });

    test('ignores activation while busy', () => {
      const onClick = vi.fn();
      render(<CTALinkOrButton loading onClick={onClick}>Saving…</CTALinkOrButton>);
      fireEvent.click(screen.getByRole('button'));
      expect(onClick).not.toHaveBeenCalled();
    });

    test('dims like disabled while busy', () => {
      render(<CTALinkOrButton loading>Saving…</CTALinkOrButton>);
      expect(screen.getByRole('button').className).includes('aria-busy:opacity-50');
    });
  });

  // Regression test for the tailwind-merge bug Greptile flagged on the PR that
  // introduced `size="large"`: callers passing a `text-{color}` className were
  // silently dropping `text-size-*` from the size config because `text-size-*`
  // wasn't registered as a font-size class group. The fix lives in `cn()`.
  test('keeps its font-size when caller adds a text colour class', () => {
    render(<CTALinkOrButton variant="unstyled" size="large" className="text-bluedot-navy">
      Click me
    </CTALinkOrButton>);
    const button = screen.getByRole('button');
    expect(button.className).includes('text-size-xs');
    expect(button.className).includes('text-bluedot-navy');
  });
});
