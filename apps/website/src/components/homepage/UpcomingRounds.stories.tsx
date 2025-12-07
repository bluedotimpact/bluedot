import type { Meta, StoryObj } from '@storybook/react';
import { UpcomingRounds } from './UpcomingRounds';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

type Round = {
  id: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  intensity: string;
  applicationDeadline: string;
  applicationDeadlineRaw: string;
  firstDiscussionDateRaw: string;
  dateRange: string;
  numberOfUnits: number;
};

const mockIntensiveRounds: Round[] = [
  {
    id: 'round-1',
    courseId: 'course-1',
    courseTitle: 'AI Safety Fundamentals: Technical Alignment',
    courseSlug: 'technical-ai-safety',
    intensity: 'intensive',
    applicationDeadline: '15 Jan',
    applicationDeadlineRaw: '2025-01-15',
    firstDiscussionDateRaw: '2025-02-01',
    dateRange: '01 Feb – 14 Feb',
    numberOfUnits: 14,
  },
  {
    id: 'round-2',
    courseId: 'course-2',
    courseTitle: 'AI Safety Fundamentals: AI Governance',
    courseSlug: 'governance',
    intensity: 'intensive',
    applicationDeadline: '22 Jan',
    applicationDeadlineRaw: '2025-01-22',
    firstDiscussionDateRaw: '2025-02-10',
    dateRange: '10 Feb – 23 Feb',
    numberOfUnits: 14,
  },
  {
    id: 'round-3',
    courseId: 'course-3',
    courseTitle: 'AGI Safety Fundamentals',
    courseSlug: 'agi-strategy',
    intensity: 'intensive',
    applicationDeadline: '01 Feb',
    applicationDeadlineRaw: '2025-02-01',
    firstDiscussionDateRaw: '2025-02-20',
    dateRange: '20 Feb – 05 Mar',
    numberOfUnits: 14,
  },
];

const mockPartTimeRounds: Round[] = [
  {
    id: 'round-4',
    courseId: 'course-1',
    courseTitle: 'AI Safety Fundamentals: Technical Alignment',
    courseSlug: 'technical-ai-safety',
    intensity: 'part-time',
    applicationDeadline: '15 Jan',
    applicationDeadlineRaw: '2025-01-15',
    firstDiscussionDateRaw: '2025-02-01',
    dateRange: '01 Feb – 28 Mar',
    numberOfUnits: 8,
  },
  {
    id: 'round-5',
    courseId: 'course-2',
    courseTitle: 'AI Safety Fundamentals: AI Governance',
    courseSlug: 'governance',
    intensity: 'part-time',
    applicationDeadline: '22 Jan',
    applicationDeadlineRaw: '2025-01-22',
    firstDiscussionDateRaw: '2025-02-10',
    dateRange: '10 Feb – 06 Apr',
    numberOfUnits: 8,
  },
  {
    id: 'round-6',
    courseId: 'course-4',
    courseTitle: 'Biosecurity Fundamentals',
    courseSlug: 'biosecurity',
    intensity: 'part-time',
    applicationDeadline: '05 Feb',
    applicationDeadlineRaw: '2025-02-05',
    firstDiscussionDateRaw: '2025-02-25',
    dateRange: '25 Feb – 21 Apr',
    numberOfUnits: 8,
  },
];

const meta: Meta<typeof UpcomingRounds> = {
  title: 'Website/Homepage/UpcomingRounds',
  component: UpcomingRounds,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The upcoming rounds section of the homepage displaying intensive and part-time course rounds. Shows course titles, date ranges, and application deadlines.',
      },
    },
    msw: {
      handlers: [
        trpcStorybookMsw.courseRounds.getAllUpcomingRounds.query(() => ({
          intense: mockIntensiveRounds,
          partTime: mockPartTimeRounds,
        })),
      ],
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
