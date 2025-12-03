import { render } from '@testing-library/react';
import {
  describe, expect, test, beforeEach,
} from 'vitest';
import { server, trpcMsw } from '../../__tests__/trpcMswSetup';
import { TrpcProvider } from '../../__tests__/trpcProvider';
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
    slug: 'course-1',
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
    slug: 'course-2',
    durationDescription: '6 weeks',
  }),
];

const defaultProps = {
  courses: mockCourses,
  loading: false,
};

describe('CourseDirectory', () => {
  beforeEach(() => {
    // Mock tRPC endpoints with empty data, results are not needed for this test
    server.use(trpcMsw.courses.getAll.query(() => []));
    server.use(trpcMsw.courseRegistrations.getAll.query(() => []));
  });

  test('renders default as expected', () => {
    const { container } = render(<CourseDirectory {...defaultProps} />, { wrapper: TrpcProvider });

    expect(container).toMatchSnapshot();
  });

  test('displays loading indicator when displayLoading is true', () => {
    const props = {
      ...defaultProps,
      loading: true,
      courses: undefined,
    };
    const { container, queryByText } = render(<CourseDirectory {...props} />, { wrapper: TrpcProvider });

    expect(queryByText(mockCourses[0]!.title!)).toBeNull();
    expect(queryByText(mockCourses[1]!.title!)).toBeNull();

    const progressDotsElement = container.querySelector('.progress-dots');
    expect(progressDotsElement).not.toBeNull();
  });
});
