import { render } from '@testing-library/react';
import {
  describe, expect, test,
} from 'vitest';
import CourseDirectory from './CourseDirectory';
import { createMockCourse } from '../../__tests__/testUtils';

const mockCourses = [
  createMockCourse({
    id: 'course-1',
    title: 'Test Course 1',
    shortDescription: 'Desc 1',
    cadence: 'MOOC',
    level: 'Beginner',
    averageRating: 4.5,
    image: 'img1.jpg',
    path: '/course1',
    durationDescription: '4 weeks',
  }),
  createMockCourse({
    id: 'course-2',
    title: 'Test Course 2',
    shortDescription: 'Desc 2',
    cadence: 'Daily',
    level: 'Intermediate',
    averageRating: 4.0,
    image: 'img2.jpg',
    path: '/course2',
    durationDescription: '6 weeks',
  }),
];

const defaultProps = {
  courses: mockCourses,
  loading: false,
};

describe('CourseDirectory', () => {
  test('renders default as expected', () => {
    const { container } = render(<CourseDirectory {...defaultProps} />);

    expect(container).toMatchSnapshot();
  });

  test('displays loading indicator when displayLoading is true', () => {
    const props = {
      ...defaultProps,
      loading: true,
      courses: undefined,
    };
    const { container, queryByText } = render(<CourseDirectory {...props} />);

    expect(queryByText(mockCourses[0]!.title!)).toBeNull();
    expect(queryByText(mockCourses[1]!.title!)).toBeNull();

    const progressDotsElement = container.querySelector('.progress-dots');
    expect(progressDotsElement).not.toBeNull();
  });
});
