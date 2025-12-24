import type { Course } from '@bluedot/db';
import type { Meta, StoryObj } from '@storybook/react';
import { createMockCourse } from '../../__tests__/testUtils';
import CourseDirectory from './CourseDirectory';

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

const mockCourses = [
  createMockCourse({
    id: '1',
    title: 'AI Safety',
    description: 'Understand the principles and practices to ensure AI systems are safe and reliable.',
    path: '/courses/ai-safety',
    slug: 'ai-safety',
    durationDescription: '5 hours',
    shortDescription: 'AI Safety course description',
    level: 'Beginner',
    averageRating: 4.5,
    isNew: true,
    isFeatured: false,
  }),
  createMockCourse({
    id: '2',
    title: 'AI Danger',
    description: 'Learn about the potential risks and challenges associated with AI technologies.',
    path: '/courses/ai-danger',
    slug: 'ai-danger',
    durationDescription: '12 weeks',
    shortDescription: 'AI Danger course description',
    level: 'Advanced',
    averageRating: 4.8,
    isNew: false,
    isFeatured: true,
  }),
  createMockCourse({
    id: '3',
    title: 'State Management Strategies',
    description: 'Explore various state management techniques and their applications in modern web development.',
    path: '/courses/state-management-strategies',
    slug: 'state-management-strategies',
    durationDescription: '12 weeks',
    shortDescription: 'State Management course description',
    level: 'Intermediate',
    averageRating: 4.2,
    isNew: false,
    isFeatured: false,
  }),
];

export const Default: Story = {
  args: {
    courses: mockCourses satisfies Course[],
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    courses: [],
    loading: true,
  },
};
