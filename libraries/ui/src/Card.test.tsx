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
    const { container } = render(
      <Card
        {...defaultProps}
        className="custom-class"
      />,
    );
    const cardElement = container.querySelector('.custom-class');
    expect(cardElement).not.toBeNull();
  });

  test('does not include ctaMetadata unless given', () => {
    const { container } = render(<Card {...defaultProps} />);
    const ctaMetadataElement = container.querySelector('.card__cta-metadata');
    expect(ctaMetadataElement).toBeNull();
  });

  test('includes ctaMetadata when given', () => {
    const { container } = render(
      <Card
        {...defaultProps}
        ctaMetadata="Some metadata"
      />,
    );
    const ctaMetadataElement = container.querySelector('.card__cta-metadata');
    expect(ctaMetadataElement).not.toBeNull();
  });
});
