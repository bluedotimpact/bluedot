import { render, fireEvent } from '@testing-library/react';
import {
  describe, expect, test, vi,
} from 'vitest';
import { AxiosError } from 'axios';
import type { AxiosRequestConfig } from 'axios';
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
  displayData: defaultDisplayData,
  displayLoading: false,
  displayError: null,
  noResults: false,
  refetch: () => {},
};

describe('CourseDirectory', () => {
  test('renders default as expected', () => {
    const { container } = render(<CourseDirectory {...defaultProps} />);

    expect(container).toMatchSnapshot();
  });

  test('triggers refetch on selecting filters', () => {
    const refetchMock = vi.fn();
    const props = { ...defaultProps, refetch: refetchMock };
    const { getByLabelText } = render(<CourseDirectory {...props} />);

    // Clear the initial call from useEffect
    refetchMock.mockClear();

    // Uncheck 'Self-paced' cadence
    const selfPacedCheckbox = getByLabelText('Self-paced');
    fireEvent.click(selfPacedCheckbox);

    expect(refetchMock).toHaveBeenCalledTimes(1);
    expect(refetchMock).toHaveBeenCalledWith({
      cadence: ['Daily', 'Weekly'], // 'MOOC' removed
      level: ['Beginner', 'Intermediate', 'Advanced'],
    });

    refetchMock.mockClear();

    // Uncheck 'Beginner' level
    const beginnerCheckbox = getByLabelText('Beginner');
    fireEvent.click(beginnerCheckbox);

    // Expect refetch to be called with updated levels (and previously updated cadences)
    expect(refetchMock).toHaveBeenCalledTimes(1);
    expect(refetchMock).toHaveBeenCalledWith({
      cadence: ['Daily', 'Weekly'],
      level: ['Intermediate', 'Advanced'], // 'Beginner' removed
    });
  });

  test('displays "no results" message and browse text when noResults is true', () => {
    const props = { ...defaultProps, noResults: true };
    const { queryByText } = render(<CourseDirectory {...props} />);

    expect(queryByText('No courses match the selected filters.')).not.toBeNull();
    expect(queryByText('Browse all courses')).not.toBeNull();

    // The courses should still be displayed (as if this is the list of all courses)
    expect(queryByText('Test Course 1')).not.toBeNull();
    expect(queryByText('Test Course 2')).not.toBeNull();
  });

  test('displays loading indicator when displayLoading is true', () => {
    const props = {
      ...defaultProps,
      displayLoading: true,
      displayData: undefined,
    };
    const { container, queryByText } = render(<CourseDirectory {...props} />);

    expect(queryByText('Test Course 1')).toBeNull();
    expect(queryByText('Test Course 2')).toBeNull();

    const progressDotsElement = container.querySelector('.progress-dots');
    expect(progressDotsElement).not.toBeNull();
  });

  test('displays error message when displayError is present', () => {
    const error = {
      message: 'Network Error',
      name: 'AxiosError',
      isAxiosError: true,
      toJSON: () => ({}),
      config: { headers: {} } as AxiosRequestConfig,
      response: undefined,
    } as AxiosError;

    const props = {
      ...defaultProps,
      displayError: error,
      displayData: undefined,
    };
    const { queryByText } = render(<CourseDirectory {...props} />);

    expect(queryByText(/If the above message doesn't help, try again later/)).not.toBeNull();
  });

  test('toggles filter visibility on mobile filter button click', () => {
    const { container } = render(<CourseDirectory {...defaultProps} />);

    const filterButton = container.querySelector('.course-directory__filter-button');
    const filtersContainer = container.querySelector('.course-directory__filters');

    expect(filterButton).not.toBeNull();
    expect(filtersContainer).not.toBeNull();

    // Initially hidden on mobile
    expect(filtersContainer?.classList.contains('hidden')).toBe(true);
    expect(filtersContainer?.classList.contains('flex')).toBe(false);

    fireEvent.click(filterButton!);

    // Now visible (has 'flex', lacks 'hidden')
    expect(filtersContainer?.classList.contains('flex')).toBe(true);
    expect(filtersContainer?.classList.contains('hidden')).toBe(false);

    fireEvent.click(filterButton!);

    // Hidden again
    expect(filtersContainer?.classList.contains('hidden')).toBe(true);
    expect(filtersContainer?.classList.contains('flex')).toBe(false);
  });
});
