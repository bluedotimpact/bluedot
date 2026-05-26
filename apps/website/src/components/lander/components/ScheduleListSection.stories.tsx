import type { Meta, StoryObj } from '@storybook/react';
import ScheduleListSection from './ScheduleListSection';
import { trpcStorybookMsw } from '../../../__tests__/trpcMswSetup.browser';

const mockIntensiveRounds = [
  {
    id: 'round-intensive-1',
    intensity: 'intensive',
    applicationDeadline: '15 Jan',
    applicationDeadlineDetailed: '15 Jan at 23:59 UTC',
    applicationDeadlineRaw: '2025-01-15',
    firstDiscussionDateRaw: '2025-01-20',
    dateRange: '20 Jan - 24 Jan',
    numberOfUnits: 5,
  },
  {
    id: 'round-intensive-2',
    intensity: 'intensive',
    applicationDeadline: '15 Feb',
    applicationDeadlineDetailed: '15 Feb at 23:59 UTC',
    applicationDeadlineRaw: '2025-02-15',
    firstDiscussionDateRaw: '2025-02-20',
    dateRange: '20 Feb - 24 Feb',
    numberOfUnits: 5,
  },
];

const mockPartTimeRounds = [
  {
    id: 'round-parttime-1',
    intensity: 'part-time',
    applicationDeadline: '1 Mar',
    applicationDeadlineDetailed: '1 Mar at 23:59 UTC',
    applicationDeadlineRaw: '2025-03-01',
    firstDiscussionDateRaw: '2025-03-10',
    dateRange: '10 Mar - 4 May',
    numberOfUnits: 8,
  },
  {
    id: 'round-parttime-2',
    intensity: 'part-time',
    applicationDeadline: '1 Jun',
    applicationDeadlineDetailed: '1 Jun at 23:59 UTC',
    applicationDeadlineRaw: '2025-06-01',
    firstDiscussionDateRaw: '2025-06-10',
    dateRange: '10 Jun - 4 Aug',
    numberOfUnits: 8,
  },
];

const meta = {
  title: 'website/CourseLander/ScheduleListSection',
  component: ScheduleListSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A list-style schedule section that fetches upcoming course rounds and renders them as `PageListRow` entries grouped into intensive and part-time. Falls back to a CTA when no rounds are open.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      description: 'Optional anchor id for in-page navigation',
      control: 'text',
    },
    title: {
      description: 'Section heading',
      control: 'text',
    },
    intro: {
      description: 'Optional intro paragraph below the heading',
      control: 'text',
    },
    courseSlug: {
      description: 'Course slug used to fetch upcoming rounds',
      control: 'text',
    },
    applicationUrl: {
      description: 'Base application URL; the round id is appended for each row',
      control: 'text',
    },
    fallbackText: {
      description: 'Content shown when no rounds are open',
      control: 'text',
    },
    fallbackCtaText: {
      description: 'CTA label shown in the fallback state',
      control: 'text',
    },
  },
} satisfies Meta<typeof ScheduleListSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Schedule',
    courseSlug: 'agi-strategy',
    applicationUrl: 'https://example.com/apply',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => ({
          intense: mockIntensiveRounds,
          partTime: mockPartTimeRounds,
        })),
      ],
    },
  },
};

export const IntensiveOnly: Story = {
  args: {
    title: 'Schedule',
    courseSlug: 'technical-ai-safety',
    applicationUrl: 'https://example.com/apply',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => ({
          intense: mockIntensiveRounds,
          partTime: [],
        })),
      ],
    },
  },
};

export const NoRoundsFallback: Story = {
  args: {
    title: 'Schedule',
    intro: 'Intensive cohorts run for 6 days at ~5h/day. Part-time cohorts run for 6 weeks at ~5h/week.',
    courseSlug: 'ai-governance',
    applicationUrl: 'https://example.com/apply',
    fallbackText: 'No rounds are open right now. Apply and we\'ll let you know when the next one opens.',
    fallbackCtaText: 'Register interest',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => ({
          intense: [],
          partTime: [],
        })),
      ],
    },
  },
};
