import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CourseSearchCard } from './CourseSearchCard';

describe('CourseSearchCard', () => {
  const defaultProps = {
    title: 'Title',
    url: 'https://bluedot.org/courses/what-the-fish',
  };

  test('renders default as expected', () => {
    const { container } = render(
      <CourseSearchCard {...defaultProps} />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { container } = render(
      <CourseSearchCard
        {...defaultProps}
        description="A short description of the course"
        duration="10 days"
        imageSrc="/courses/what-the-fish/image.png"
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
