import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CourseCard } from './CourseCard';

describe('CourseCard', () => {
  const baseProps = {
    title: 'Introduction to Testing',
    description: 'Learn proper testing techniques',
    courseType: 'Crash course',
    image: '/test-image.jpg',
  };

  test('renders default as expected', () => {
    const { container } = render(<CourseCard {...baseProps} />);
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container } = render(
      <CourseCard
        {...baseProps}
        className="custom-class"
        cardType="Featured"
      />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with optional yield', () => {
    const { container } = render(
      <CourseCard {...baseProps}>
        <button test-id="test-element" type="button">Enroll Now</button>
      </CourseCard>,
    );
    const yieldedContent = screen.getByTestId('test-element');
    expect(yieldedContent).toBeTruthy();
  });
});
