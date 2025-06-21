import type { Meta, StoryObj } from '@storybook/react';
import type { GetCoursesResponse } from '../../pages/api/courses';
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

export const Default: Story = {
  args: {
    courses: [
      {
        id: '1',
        title: 'AI Safety',
        description: 'Understand the principles and practices to ensure AI systems are safe and reliable.',
        cadence: 'MOOC',
        path: '/courses/ai-safety',
        slug: 'ai-safety',
        units: [],
        certificationBadgeImage: null,
        certificationDescription: null,
        detailsUrl: 'https://bluedot.org/courses/ai-safety',
        displayOnCourseHubIndex: true,
        image: null,
        durationDescription: '5 hours',
        durationHours: null,
        shortDescription: 'AI Safety course description',
        level: 'Beginner',
        averageRating: 4.5,
        publicLastUpdated: null,
        isNew: true,
        isFeatured: false,
      },
      {
        id: '2',
        title: 'AI Danger',
        description: 'Learn about the potential risks and challenges associated with AI technologies.',
        cadence: 'Weekly',
        path: '/courses/ai-danger',
        slug: 'ai-danger',
        units: [],
        certificationBadgeImage: null,
        certificationDescription: null,
        detailsUrl: 'https://bluedot.org/courses/ai-danger',
        displayOnCourseHubIndex: true,
        image: null,
        durationDescription: '12 weeks',
        durationHours: null,
        shortDescription: 'AI Danger course description',
        level: 'Advanced',
        averageRating: 4.8,
        publicLastUpdated: null,
        isNew: false,
        isFeatured: true,
      },
      {
        id: '3',
        title: 'State Management Strategies',
        description: 'Explore various state management techniques and their applications in modern web development.',
        cadence: 'Daily',
        path: '/courses/state-management-strategies',
        slug: 'state-management-strategies',
        units: [],
        certificationBadgeImage: null,
        certificationDescription: null,
        detailsUrl: 'https://bluedot.org/courses/state-management-strategies',
        displayOnCourseHubIndex: true,
        image: null,
        durationDescription: '12 weeks',
        durationHours: null,
        shortDescription: 'State Management course description',
        level: 'Intermediate',
        averageRating: 4.2,
        publicLastUpdated: null,
        isNew: false,
        isFeatured: false,
      },
    ] satisfies GetCoursesResponse['courses'],
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    courses: undefined,
    loading: true,
  },
};
