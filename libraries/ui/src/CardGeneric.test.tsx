import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CardGeneric } from './CardGeneric';

describe('CardGeneric', () => {
  const defaultProps = {
    imageSrc: '/images/team/member.jpg',
    name: 'John Doe',
    role: 'Developer',
    linkedInUrl: 'https://linkedin.com/in/johndoe',
  };

  test('renders default as expected', () => {
    const { container } = render(<CardGeneric {...defaultProps} />);
    expect(container).toMatchSnapshot();
  });

  test('renders with custom image dimensions', () => {
    const { container } = render(
      <CardGeneric
        {...defaultProps}
        imageSrc="/images/team/custom-size.jpg"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with custom className', () => {
    const { container } = render(
      <CardGeneric
        {...defaultProps}
        className="custom-class"
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
