import type { Meta, StoryObj } from '@storybook/react';
import { createMockCourse } from '../../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../../__tests__/trpcMswSetup.browser';
import CoursesPage from '../../../pages/courses/index';

const mockCourses = [
  createMockCourse({
    id: 'course-foai',
    slug: 'future-of-ai',
    title: 'The Future of AI',
    path: '/courses/future-of-ai',
    durationHours: 1,
    durationDescription: '1 hour',
    displayOnCourseHubIndex: true,
  }),
  createMockCourse({
    id: 'course-gov',
    slug: 'ai-governance',
    title: 'AI Governance',
    path: '/courses/ai-governance',
    durationHours: 30,
    durationDescription: '8 weeks',
    displayOnCourseHubIndex: true,
  }),
  createMockCourse({
    id: 'course-agi',
    slug: 'agi-strategy',
    title: 'AGI Strategy',
    path: '/courses/agi-strategy',
    durationHours: 30,
    durationDescription: '5 days',
    displayOnCourseHubIndex: true,
  }),
  createMockCourse({
    id: 'course-tais',
    slug: 'technical-ai-safety',
    title: 'Technical AI Safety',
    path: '/courses/technical-ai-safety',
    durationHours: 30,
    durationDescription: '8 weeks',
    displayOnCourseHubIndex: true,
    isNew: true,
  }),
  createMockCourse({
    id: 'course-bio',
    slug: 'biosecurity',
    title: 'Biosecurity',
    path: '/courses/biosecurity',
    durationHours: 30,
    durationDescription: '8 weeks',
    displayOnCourseHubIndex: true,
    isNew: true,
  }),
];

const mockIntensiveRounds = [
  {
    id: 'round-intensive-1',
    intensity: 'intensive' as const,
    applicationDeadline: '15 Jan',
    applicationDeadlineRaw: '2025-01-15',
    firstDiscussionDateRaw: '2025-01-20',
    dateRange: '20 Jan - 24 Jan',
    numberOfUnits: 5,
  },
  {
    id: 'round-intensive-2',
    intensity: 'intensive' as const,
    applicationDeadline: '15 Feb',
    applicationDeadlineRaw: '2025-02-15',
    firstDiscussionDateRaw: '2025-02-20',
    dateRange: '20 Feb - 24 Feb',
    numberOfUnits: 5,
  },
];

const mockPartTimeRounds = [
  {
    id: 'round-parttime-1',
    intensity: 'part-time' as const,
    applicationDeadline: '01 Mar',
    applicationDeadlineRaw: '2025-03-01',
    firstDiscussionDateRaw: '2025-03-10',
    dateRange: '10 Mar - 04 May',
    numberOfUnits: 8,
  },
  {
    id: 'round-parttime-2',
    intensity: 'part-time' as const,
    applicationDeadline: '01 Jun',
    applicationDeadlineRaw: '2025-06-01',
    firstDiscussionDateRaw: '2025-06-10',
    dateRange: '10 Jun - 04 Aug',
    numberOfUnits: 8,
  },
];

const meta = {
  title: 'Website/Courses/CoursesPage',
  component: CoursesPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The main course schedule page displaying all available courses with their upcoming rounds.',
      },
    },
    nextjs: {
      appDirectory: false,
      router: {
        pathname: '/courses',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CoursesPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getAll.query(() => mockCourses),
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(({ input }) => {
          if (input.courseSlug === 'future-of-ai') {
            return { intense: [], partTime: [] };
          }
          return {
            intense: mockIntensiveRounds,
            partTime: mockPartTimeRounds,
          };
        }),
      ],
    },
  },
};
