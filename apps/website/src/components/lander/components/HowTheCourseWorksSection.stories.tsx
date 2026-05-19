import type { Meta, StoryObj } from '@storybook/react';
import HowTheCourseWorksSection, { type CourseUnits } from './HowTheCourseWorksSection';
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
];

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

const sampleParagraphs = ({ intenseUnits, partTimeUnits }: CourseUnits) => [
  `The course runs in two formats. The intensive cohort covers ${intenseUnits ?? 5} units across ${intenseUnits ?? 5} days, at roughly five hours a day. The part-time cohort covers ${partTimeUnits ?? 8} units across ${partTimeUnits ?? 8} weeks, at roughly five hours a week. Both end in the same place.`,
  'Every week you complete the readings on your own, then meet with eight peers and an experienced facilitator for a two-hour Zoom discussion. The facilitator is an expert in AI safety who can challenge your assumptions and connect the readings to real ongoing work.',
  'Discussions run across a wide range of time zones. You tell us your availability and we put you in a group that fits your schedule.',
];

const meta: Meta<typeof HowTheCourseWorksSection> = {
  title: 'website/CourseLander/HowTheCourseWorksSection',
  component: HowTheCourseWorksSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'An editorial prose section explaining the course format. Reads round metadata from the API to inject the current unit counts into the copy.',
      },
    },
    ...defaultMswHandlers,
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
    courseSlug: {
      description: 'Course slug used to fetch round info for unit counts',
      control: 'text',
    },
    paragraphs: {
      description: 'Function returning an array of paragraph nodes, given the fetched unit counts',
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'How the course works',
    courseSlug: 'agi-strategy',
    paragraphs: sampleParagraphs,
  },
};
