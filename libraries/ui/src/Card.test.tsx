import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  const defaultProps = {
    imageSrc: '/images/team/member.jpg',
    title: 'John Doe',
    subtitle: 'Developer',
    ctaUrl: 'https://linkedin.com/in/johndoe',
    ctaText: 'LinkedIn',
  };

  test('renders default as expected', () => {
    const { container } = render(<Card {...defaultProps} />);
    expect(container).toMatchSnapshot();

    const anchorElement = container.querySelector('a.card__cta');
    expect(anchorElement).not.toBeNull();
    expect(anchorElement?.getAttribute('href')).toBe(defaultProps.ctaUrl);
  });

  test('renders with isEntireCardClickable as expected', () => {
    const { container } = render(<Card {...defaultProps} isEntireCardClickable />);
    expect(container).toMatchSnapshot();

    const anchorElement = container.querySelector('a.card');
    expect(anchorElement).not.toBeNull();
    expect(anchorElement?.getAttribute('href')).toBe(defaultProps.ctaUrl);
  });

  test('renders with custom className', () => {
    const { container } = render(<Card
      {...defaultProps}
      className="custom-class"
    />);
    const cardElement = container.querySelector('.custom-class');
    expect(cardElement).not.toBeNull();
  });

  test('does not include footer unless given', () => {
    const { container } = render(<Card {...defaultProps} />);
    const ctaMetadataElement = container.querySelector('.card__footer');
    expect(ctaMetadataElement).toBeNull();
  });

  test('includes footer when given', () => {
    const { container } = render(<Card {...defaultProps}>A footer of some kind</Card>);
    const ctaMetadataElement = container.querySelector('.card__footer');
    expect(ctaMetadataElement).not.toBeNull();
  });
});
