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

  test('without ctaText, the title is the single stretched link', () => {
    const { ctaText: _, ...props } = defaultProps;
    const { container } = render(<Card {...props} />);
    expect(container).toMatchSnapshot();

    const anchors = container.querySelectorAll('a, button');
    expect(anchors).toHaveLength(1);
    expect(anchors[0]?.getAttribute('href')).toBe(props.url);
    expect(anchors[0]?.textContent).toBe(props.title);
    expect(anchors[0]?.className).toContain('after:inset-0');
  });

  test('image is decorative (empty alt)', () => {
    const { container } = render(<Card {...defaultProps} />);
    expect(container.querySelector('img')?.getAttribute('alt')).toBe('');
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
    expect(shell?.tagName).toBe('DIV');
  });
});
