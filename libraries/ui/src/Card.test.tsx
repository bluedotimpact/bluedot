import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Card, CardShell } from './Card';

describe('Card', () => {
  const defaultProps = {
    imageSrc: '/images/team/member.jpg',
    title: 'John Doe',
    subtitle: 'Developer',
    url: 'https://linkedin.com/in/johndoe',
    ctaText: 'LinkedIn',
  };

  test('renders the CTA as the single real link, stretched over the card', () => {
    const { container } = render(<Card {...defaultProps} />);
    expect(container).toMatchSnapshot();

    const anchors = container.querySelectorAll('a');
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.getAttribute('href')).toBe(defaultProps.url);
    expect(anchors[0]?.textContent).toBe(defaultProps.ctaText);
    expect(anchors[0]?.className).toContain('after:inset-0');
    expect(container.firstElementChild?.className).toContain('relative');
  });

  test('accessible name combines CTA text and title so card lists are distinguishable', () => {
    const { container } = render(<Card {...defaultProps} />);
    expect(container.querySelector('a')?.getAttribute('aria-label')).toBe('LinkedIn: John Doe');
  });

  test('body slot sits above the stretched link and outside the anchor', () => {
    const { container } = render(<Card {...defaultProps}>
      <span>Body <em>copy</em></span>
    </Card>);
    const anchor = container.querySelector('a');
    expect(anchor?.textContent).not.toContain('Body copy');
    const body = container.querySelector('em')?.closest('.z-10');
    expect(body).not.toBeNull();
    expect(container.querySelectorAll('a, button')).toHaveLength(1);
  });

  test('image is decorative (empty alt)', () => {
    const { container } = render(<Card {...defaultProps} />);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  test('renders subtitle badge as a Tag', () => {
    const { container } = render(<Card {...defaultProps} subtitleBadge="New" />);
    const badge = container.querySelector('span');
    expect(badge?.textContent).toBe('New');
  });

  test('renders with custom className', () => {
    const { container } = render(<Card {...defaultProps} className="custom-class" />);
    expect(container.querySelector('.custom-class')).not.toBeNull();
  });

  test('isFullWidth switches to a row layout on desktop with the CTA alongside', () => {
    const { container } = render(<Card {...defaultProps} isFullWidth />);
    expect(container.firstElementChild?.className).toContain('md:flex-row');
    expect(container.querySelector('a')?.textContent).toBe('LinkedIn');
    expect(container).toMatchSnapshot();
  });
});

describe('CardShell', () => {
  test('renders the container styles around children', () => {
    const { container } = render(<CardShell className="custom-class">Content</CardShell>);
    const shell = container.firstElementChild;
    expect(shell?.className).toContain('rounded-surface');
    expect(shell?.className).toContain('p-6');
    expect(shell?.className).toContain('custom-class');
    expect(shell?.textContent).toBe('Content');
  });

  test('url renders the shell as a single link with hover affordance', () => {
    const { container } = render(<CardShell url="/somewhere">Content</CardShell>);
    const anchor = container.querySelector('a');
    expect(anchor?.getAttribute('href')).toBe('/somewhere');
    expect(anchor?.className).toContain('hover:shadow-sm');
    expect(container.querySelectorAll('a')).toHaveLength(1);
  });

  test('without url (or with null) renders a plain div with no hover affordance', () => {
    const { container, rerender } = render(<CardShell>Content</CardShell>);
    expect(container.querySelector('a')).toBeNull();
    expect(container.firstElementChild?.className).not.toContain('hover:shadow-sm');
    rerender(<CardShell url={null}>Content</CardShell>);
    expect(container.querySelector('a')).toBeNull();
  });
});
