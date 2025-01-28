import React from 'react';
import { describe, expect, test } from 'vitest';
import { render } from '@testing-library/react';
import { CourseCard } from './CourseCard';

describe('CourseCard', () => {
  const defaultProps = {
    title: 'Title',
    description: 'Description',
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
        courseType="Self-paced"
        imageSrc="/images/team/custom-size.jpg"
      />,
    );
    const applicationDeadlineEl = container.querySelector('.course-card__application-deadline');
    expect(applicationDeadlineEl).toMatchSnapshot();
    const courseLengthEl = container.querySelector('.course-card__metadata-item');
    expect(courseLengthEl).toMatchSnapshot();
    const imgEl = container.querySelector('.course-card__image');
    expect(imgEl).toMatchSnapshot();
  });
});
