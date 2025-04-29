import type { Meta, StoryObj } from '@storybook/react';
import { useState, useEffect, useCallback } from 'react';
import type { AxiosError } from 'axios';
import type { GetCoursesResponse, CoursesRequestBody } from '../../pages/api/courses';
import CourseDirectory from './CourseDirectory';

const mockCourseData: GetCoursesResponse = {
  courses: [
    // @ts-expect-error only essential fields for display
    {
      title: 'AI Safety',
      shortDescription: 'Understand the principles and practices to ensure AI systems are safe and reliable.',
      cadence: 'MOOC',
      level: 'Beginner',
      averageRating: 4.7,
      image: '/images/courses/default.jpg',
      path: '/courses/ai-safety',
    },
    // @ts-expect-error only essential fields for display
    {
      title: 'AI Danger',
      shortDescription: 'Learn about the potential risks and challenges associated with AI technologies.',
      cadence: 'Weekly',
      level: 'Advanced',
      averageRating: 4.9,
      image: '/images/courses/default.jpg',
      path: '/courses/ai-danger',
    },
    // @ts-expect-error only essential fields for display
    {
      title: 'State Management Strategies',
      shortDescription: 'Explore various state management techniques and their applications in modern web development.',
      cadence: 'Daily',
      level: 'Intermediate',
      averageRating: 4.5,
      image: '/images/courses/default.jpg',
      path: '/courses/state-management-strategies',
    },
  ],
};

const CourseDirectoryWrapper = () => {
  const [displayData, setDisplayData] = useState<GetCoursesResponse | undefined>(undefined);
  const [displayLoading, setDisplayLoading] = useState<boolean>(true);
  const [noResults, setNoResults] = useState<boolean>(false);

  const refetch = useCallback((filters: CoursesRequestBody) => {
    setDisplayLoading(true);
    setNoResults(false);
    setDisplayData(undefined);

    // Simulate network delay
    setTimeout(() => {
      const results = mockCourseData.courses.filter((course) => {
        const matchesLevel = filters?.level?.includes(course.level);
        const matchesCadence = filters?.cadence?.includes(course.cadence);
        return matchesLevel && matchesCadence;
      });

      setDisplayData({ courses: results, type: 'success' });
      setNoResults(results.length === 0);
      setDisplayLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    refetch({
      cadence: ['MOOC', 'Daily', 'Weekly'],
      level: ['Beginner', 'Intermediate', 'Advanced'],
    });
  }, [refetch]);

  return (
    <CourseDirectory
      displayData={displayData}
      displayLoading={displayLoading}
      noResults={noResults}
      refetch={refetch}
    />
  );
};

const meta = {
  title: 'website/courses/CourseDirectory',
  component: CourseDirectoryWrapper,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof CourseDirectoryWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
