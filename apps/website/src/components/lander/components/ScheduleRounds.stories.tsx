import type { Meta, StoryObj } from '@storybook/react';
import { CTALinkOrButton } from '@bluedot/ui';
import { ScheduleRounds } from './ScheduleRounds';
import { trpcStorybookMsw } from '../../../__tests__/trpcMswSetup.browser';

const mockIntensiveRounds = [
  {
    id: 'round-intensive-1',
    intensity: 'intensive',
    applicationDeadline: '15 Jan',
    applicationDeadlineRaw: '2025-01-15',
    firstDiscussionDateRaw: '2025-01-20',
    dateRange: '20 Jan - 24 Jan',
    numberOfUnits: 5,
  },
  {
    id: 'round-intensive-2',
    intensity: 'intensive',
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
    intensity: 'part-time',
    applicationDeadline: '1 Mar',
    applicationDeadlineRaw: '2025-03-01',
    firstDiscussionDateRaw: '2025-03-10',
    dateRange: '10 Mar - 4 May',
    numberOfUnits: 8,
  },
  {
    id: 'round-parttime-2',
    intensity: 'part-time',
    applicationDeadline: '1 Jun',
    applicationDeadlineRaw: '2025-06-01',
    firstDiscussionDateRaw: '2025-06-10',
    dateRange: '10 Jun - 4 Aug',
    numberOfUnits: 8,
  },
];

const FallbackContent = (
  <div className="flex flex-col gap-4">
    <div className="text-[15px] leading-[160%] text-[#13132E] opacity-80 font-normal">
      Check above for upcoming rounds and application deadlines.
    </div>
    <div className="flex justify-start">
      <CTALinkOrButton
        url="https://example.com/apply"
        className="px-5 py-[9px] md:px-5 md:py-3 text-size-xs md:text-[16px] font-medium bg-bluedot-normal text-white rounded-md hover:bg-[#1a3399] cursor-pointer transition-colors"
      >
        Apply now
      </CTALinkOrButton>
    </div>
  </div>
);

const meta = {
  title: 'website/CourseLander/ScheduleRounds',
  component: ScheduleRounds,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays dynamic course schedule rounds fetched from the API. Shows intensive and/or part-time course options with application deadlines and date ranges.',
      },
    },
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="max-w-[800px] p-8 bg-white">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    courseSlug: {
      description: 'Course identifier used to fetch schedule rounds from the API',
      control: 'text',
    },
    applicationUrl: {
      description: 'URL for apply buttons, will have round ID appended',
      control: 'text',
    },
    fallbackContent: {
      description: 'Content to display when no dynamic schedule is available',
      control: false,
    },
  },
} satisfies Meta<typeof ScheduleRounds>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultMswHandlers = {
  msw: {
    handlers: [
      trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => ({
        intense: mockIntensiveRounds,
        partTime: mockPartTimeRounds,
      })),
    ],
  },
};

export const Default: Story = {
  args: {
    courseSlug: 'agi-strategy',
    applicationUrl: 'https://example.com/apply',
    fallbackContent: FallbackContent,
  },
  parameters: defaultMswHandlers,
};

export const AgiStrategyColors: Story = {
  args: {
    courseSlug: 'agi-strategy',
    applicationUrl: 'https://example.com/apply',
    fallbackContent: FallbackContent,
    accentColor: '#9177dc',
  },
  parameters: defaultMswHandlers,
};

export const BiosecurityColors: Story = {
  args: {
    courseSlug: 'biosecurity',
    applicationUrl: 'https://example.com/apply',
    fallbackContent: FallbackContent,
    accentColor: '#3da462',
  },
  parameters: defaultMswHandlers,
};

export const FutureOfAiColors: Story = {
  args: {
    courseSlug: 'future-of-ai',
    applicationUrl: 'https://example.com/apply',
    fallbackContent: FallbackContent,
    accentColor: '#8c8146',
  },
  parameters: defaultMswHandlers,
};

export const AiGovernanceColors: Story = {
  args: {
    courseSlug: 'ai-governance',
    applicationUrl: 'https://example.com/apply',
    fallbackContent: FallbackContent,
    accentColor: '#4092d6',
  },
  parameters: defaultMswHandlers,
};

export const TechnicalAiSafetyColors: Story = {
  args: {
    courseSlug: 'technical-ai-safety',
    applicationUrl: 'https://example.com/apply',
    fallbackContent: FallbackContent,
    accentColor: '#a060bb',
  },
  parameters: defaultMswHandlers,
};
