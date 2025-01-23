import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  const defaultProps = {
    imageSrc: '/images/team/member.jpg',
    title: 'John Doe',
    subtitle: 'Developer',
    ctaUrl: 'https://linkedin.com/in/johndoe',
  };

  test('renders default as expected', () => {
    const { container } = render(<Card {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  test('renders with custom image dimensions', () => {
    const { container } = render(
      <Card
        {...defaultProps}
        imageSrc="/images/team/custom-size.jpg"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with custom className', () => {
    const { container } = render(
      <Card
        {...defaultProps}
        className="custom-class"
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
