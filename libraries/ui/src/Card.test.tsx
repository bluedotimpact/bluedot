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

  test('renders as a single link wrapping the whole card', () => {
    const { container } = render(<Card {...defaultProps} />);
    expect(container).toMatchSnapshot();

    const anchors = container.querySelectorAll('a');
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.getAttribute('href')).toBe(defaultProps.url);
  });

  test('CTA is presentational — no nested interactive elements', () => {
    const { container } = render(<Card {...defaultProps} />);
    const anchor = container.querySelector('a');
    expect(anchor?.querySelectorAll('a, button')).toHaveLength(0);
    expect(anchor?.textContent).toContain('LinkedIn');
  });

  test('image is decorative (empty alt)', () => {
    const { container } = render(<Card {...defaultProps} />);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
  });

  test('renders subtitle badge as a Tag', () => {
    const { container } = render(<Card {...defaultProps} subtitleBadge="New" />);
    expect(container.textContent).toContain('New');
  });

  test('renders with custom className', () => {
    const { container } = render(<Card {...defaultProps} className="custom-class" />);
    expect(container.querySelector('.custom-class')).not.toBeNull();
  });

  test('renders children in the body slot', () => {
    const { container } = render(<Card {...defaultProps}>Body copy</Card>);
    expect(container.textContent).toContain('Body copy');
  });
});

describe('CardShell', () => {
  test('renders the container styles around children', () => {
    const { container } = render(<CardShell className="custom-class">Content</CardShell>);
    const shell = container.firstElementChild;
    expect(shell?.className).toContain('rounded-lg');
    expect(shell?.className).toContain('custom-class');
    expect(shell?.textContent).toBe('Content');
  });
});
