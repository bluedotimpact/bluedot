import type { Meta, StoryObj } from '@storybook/react';
import type { GetCoursesResponse } from '../../pages/api/courses';
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

const meta = {
  title: 'website/courses/CourseDirectory',
  component: CourseDirectory,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof CourseDirectory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    displayData: mockCourseData,
    displayLoading: false,
  },
};

export const Loading: Story = {
  args: {
    displayData: undefined,
    displayLoading: true,
  },
};
