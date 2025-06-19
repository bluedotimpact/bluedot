import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CourseCard } from './CourseCard';

describe('CourseCard', () => {
  const defaultProps = {
    imageSrc: '/images/courses/course.jpg',
    title: 'Title',
    description: 'Description',
    url: 'https://bluedot.org/courses/what-the-fish',
    cadence: 'Self-paced',
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
    const { container } = render(
      <CourseCard
        {...defaultProps}
        applicationDeadline="Feb 1"
        cadence="Self-paced"
        imageSrc="/images/team/custom-size.jpg"
      />,
    );
    const courseLengthEl = container.querySelector('.course-card__length');
    expect(courseLengthEl).toMatchSnapshot();
    const imgEl = container.querySelector('.course-card__image');
    expect(imgEl).toMatchSnapshot();
  });
});
