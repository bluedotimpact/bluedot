import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CourseCard } from './CourseCard';

describe('CourseCard', () => {
  const defaultProps = {
    imageSrc: '/images/courses/course.jpg',
    title: 'Title',
    description: 'Description',
    url: 'https://bluedot.org/courses/what-the-fish',
    courseLength: '10 hours',
  };

  test('renders default as expected', () => {
    const { container } = render(
      <CourseCard {...defaultProps} />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders Featured as expected', () => {
    const { container } = render(
      <CourseCard {...defaultProps} cardType="Featured" />,
    );
    expect(container).toMatchSnapshot();
  });

  test('renders with optional args', () => {
    const { getByRole } = render(
      <CourseCard
        {...defaultProps}
        applicationDeadline="Feb 1"
        imageSrc="/images/team/custom-size.jpg"
      />,
    );
    const imgEl = getByRole('img');
    expect(imgEl).toMatchSnapshot();
  });
});
