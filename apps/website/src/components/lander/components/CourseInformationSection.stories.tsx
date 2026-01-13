import type { Meta, StoryObj } from '@storybook/react';
import {
  PiClockClockwise,
  PiChats,
  PiHandHeart,
  PiCalendarDots,
} from 'react-icons/pi';
import CourseInformationSection from './CourseInformationSection';
import { trpcStorybookMsw } from '../../../__tests__/trpcMswSetup.browser';

const mockIntensiveRounds = [
  {
    id: 'round-1',
    intensity: 'intensive',
    applicationDeadline: '15 Jan',
    applicationDeadlineRaw: '2025-01-15',
    firstDiscussionDateRaw: '2025-01-20',
    dateRange: '20 Jan - 24 Jan',
    numberOfUnits: 5,
  },
  {
    id: 'round-2',
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
    id: 'round-3',
    intensity: 'part-time',
    applicationDeadline: '01 Mar',
    applicationDeadlineRaw: '2025-03-01',
    firstDiscussionDateRaw: '2025-03-10',
    dateRange: '10 Mar - 04 May',
    numberOfUnits: 8,
  },
];

const baseDetails = [
  {
    icon: PiClockClockwise,
    label: 'Commitment',
    description: (
      <>
        Each day or week, you will:
        <br />
        <span className="font-semibold">Complete 2-3 hours</span> of reading and writing, and <span className="font-semibold">join ~8 peers in a 2-hour Zoom meeting</span> to discuss the content.
      </>
    ),
  },
  {
    icon: PiChats,
    label: 'Facilitator',
    description: 'All discussions will be facilitated by an AI safety expert.',
  },
  {
    icon: PiHandHeart,
    label: 'Price',
    description: 'This course is freely available and operates on a "pay-what-you-want" model.',
  },
  {
    icon: PiCalendarDots,
    label: 'Schedule',
    description: null,
    isSchedule: true,
    scheduleDescription: 'Check above for upcoming rounds and application deadlines.',
  },
];

const meta = {
  title: 'website/CourseLander/CourseInformationSection',
  component: CourseInformationSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A section displaying course information including commitment, facilitator, price, and dynamic schedule rounds. Used on course landing pages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Section heading displayed at the top',
      control: 'text',
    },
    applicationUrl: {
      description: 'URL for apply buttons (should include UTM parameters)',
      control: 'text',
    },
    details: {
      description: 'Array of course detail items to display',
      control: 'object',
    },
    scheduleCtaText: {
      description: 'Text for the CTA button in the schedule section',
      control: 'text',
    },
    courseSlug: {
      description: 'Course slug used to fetch dynamic schedule rounds',
      control: 'text',
    },
  },
} satisfies Meta<typeof CourseInformationSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Course information',
    applicationUrl: 'https://example.com/apply?utm_source=storybook',
    details: baseDetails,
    scheduleCtaText: 'Apply now',
    courseSlug: 'agi-strategy',
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

export const WithIntensiveOnly: Story = {
  args: {
    title: 'Course information',
    applicationUrl: 'https://example.com/apply',
    details: baseDetails,
    scheduleCtaText: 'Apply now',
    courseSlug: 'technical-ai-safety',
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

export const WithPartTimeOnly: Story = {
  args: {
    title: 'Course information',
    applicationUrl: 'https://example.com/apply',
    details: baseDetails,
    scheduleCtaText: 'Apply now',
    courseSlug: 'biosecurity',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => ({
          intense: [],
          partTime: mockPartTimeRounds,
        })),
      ],
    },
  },
};

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

export const AgiStrategyColors: Story = {
  args: {
    title: 'Course information',
    applicationUrl: 'https://example.com/apply',
    details: baseDetails,
    scheduleCtaText: 'Apply now',
    courseSlug: 'agi-strategy',
    accentColor: '#9177dc',
  },
  parameters: defaultMswHandlers,
};

export const BiosecurityColors: Story = {
  args: {
    title: 'Course information',
    applicationUrl: 'https://example.com/apply',
    details: baseDetails,
    scheduleCtaText: 'Apply now',
    courseSlug: 'biosecurity',
    accentColor: '#3da462',
  },
  parameters: defaultMswHandlers,
};

export const FutureOfAiColors: Story = {
  args: {
    title: 'Course information',
    applicationUrl: 'https://example.com/apply',
    details: baseDetails,
    scheduleCtaText: 'Apply now',
    courseSlug: 'future-of-ai',
    accentColor: '#8c8146',
  },
  parameters: defaultMswHandlers,
};

export const AiGovernanceColors: Story = {
  args: {
    title: 'Course information',
    applicationUrl: 'https://example.com/apply',
    details: baseDetails,
    scheduleCtaText: 'Apply now',
    courseSlug: 'ai-governance',
    accentColor: '#4092d6',
  },
  parameters: defaultMswHandlers,
};

export const TechnicalAiSafetyColors: Story = {
  args: {
    title: 'Course information',
    applicationUrl: 'https://example.com/apply',
    details: baseDetails,
    scheduleCtaText: 'Apply now',
    courseSlug: 'technical-ai-safety',
    accentColor: '#a060bb',
  },
  parameters: defaultMswHandlers,
};
