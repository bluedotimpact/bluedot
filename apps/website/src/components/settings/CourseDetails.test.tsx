/* eslint-disable import/no-extraneous-dependencies */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import CourseDetails from './CourseDetails';

describe('CourseDetails', () => {
  const mockCourse = {
    id: 'course-1',
    title: 'Introduction to AI Safety',
    description: 'Learn the fundamentals of AI safety and alignment.',
    durationDescription: '8 weeks',
    image: '/course-image.jpg',
    path: '/courses/ai-safety',
    certificationBadgeImage: null,
    certificationDescription: null,
    detailsUrl: '',
    displayOnCourseHubIndex: true,
    durationHours: 40,
    slug: 'ai-safety',
    shortDescription: '',
    units: [],
    cadence: 'Weekly',
    level: 'Beginner',
    averageRating: null,
    publicLastUpdated: null,
    isFeatured: false,
    isNew: false,
  };

  it('displays course overview and duration', () => {
    render(
      <CourseDetails
        course={mockCourse}
      />,
    );

    expect(screen.getByRole('region', { name: 'Expanded details for Introduction to AI Safety' })).toBeInTheDocument();
    expect(screen.getByText('About this course')).toBeInTheDocument();
    expect(screen.getByText('Duration: 8 weeks')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Overview', selected: true })).toBeInTheDocument();
  });
});
