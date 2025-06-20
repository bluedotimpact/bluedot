import { render } from '@testing-library/react';
import {
  describe, expect, test,
} from 'vitest';
import type { GetCoursesResponse } from '../../pages/api/courses';
import CourseDirectory, { CourseDirectoryProps } from './CourseDirectory';

const defaultDisplayData: GetCoursesResponse = {
  courses: [
    // @ts-expect-error not all values are needed
    {
      title: 'Test Course 1',
      shortDescription: 'Desc 1',
      cadence: 'MOOC',
      level: 'Beginner',
      averageRating: 4.5,
      image: 'img1.jpg',
      path: '/course1',
    },
    // @ts-expect-error not all values are needed
    {
      title: 'Test Course 2',
      shortDescription: 'Desc 2',
      cadence: 'Daily',
      level: 'Intermediate',
      averageRating: 4.0,
      image: 'img2.jpg',
      path: '/course2',
    },
  ],
};

const defaultProps: CourseDirectoryProps = {
  courses: defaultDisplayData,
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
      displayLoading: true,
      displayData: undefined,
    };
    const { container, queryByText } = render(<CourseDirectory {...props} />);

    expect(queryByText(defaultDisplayData.courses[0]!.title!)).toBeNull();
    expect(queryByText(defaultDisplayData.courses[1]!.title!)).toBeNull();

    const progressDotsElement = container.querySelector('.progress-dots');
    expect(progressDotsElement).not.toBeNull();
  });
});
