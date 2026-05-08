import { loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { createMockRound } from '../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import CourseCompletionSection from './CourseCompletionSection';

const mockApplication = {
  applicationDeadline: '15 Jan',
  applicationUrl: 'https://bluedot.org/apply',
  hasApplied: false,
};

const mockRounds = {
  intense: [
    createMockRound({ dateRange: '20 – 24 Jan' }),
    createMockRound({
      applicationDeadline: '12 Feb',
      applicationDeadlineRaw: '2025-02-12',
      firstDiscussionDateRaw: '2025-02-17',
      dateRange: '17 – 21 Feb',
    }),
  ],
  partTime: [
    createMockRound({
      intensity: 'part-time',
      applicationDeadlineRaw: '2025-01-15',
      firstDiscussionDateRaw: '2025-01-20',
      dateRange: '20 Jan – 24 Feb',
      numberOfUnits: 6,
    }),
  ],
};

const meta: Meta<typeof CourseCompletionSection> = {
  title: 'website/courses/CourseCompletionSection',
  component: CourseCompletionSection,
  parameters: {
    layout: 'padded',
  },
  args: {
    courseId: 'course-1',
    courseTitle: 'AGI Strategy',
    courseSlug: 'agi-strategy',
  },
  ...loggedOutStory(),
};

export default meta;
type Story = StoryObj<typeof meta>;

export const EnrollmentCTA: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courseRounds.getCourseApplication.query(() => mockApplication),
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => mockRounds),
      ],
    },
  },
};

const manyMockRounds = {
  intense: [
    createMockRound({ dateRange: '1 – 5 Jun', applicationDeadline: '24 May' }),
    createMockRound({ dateRange: '15 – 19 Jun', applicationDeadline: '7 Jun' }),
    createMockRound({ dateRange: '29 Jun – 3 Jul', applicationDeadline: '21 Jun' }),
    createMockRound({ dateRange: '13 – 17 Jul', applicationDeadline: '5 Jul' }),
    createMockRound({ dateRange: '27 – 31 Jul', applicationDeadline: '19 Jul' }),
  ],
  partTime: [
    createMockRound({
      intensity: 'part-time', dateRange: '1 Jun – 5 Jul', applicationDeadline: '24 May', numberOfUnits: 5,
    }),
    createMockRound({
      intensity: 'part-time', dateRange: '6 Jul – 9 Aug', applicationDeadline: '28 Jun', numberOfUnits: 5,
    }),
    createMockRound({
      intensity: 'part-time', dateRange: '3 Aug – 6 Sep', applicationDeadline: '26 Jul', numberOfUnits: 5,
    }),
    createMockRound({
      intensity: 'part-time', dateRange: '7 Sep – 12 Oct', applicationDeadline: '30 Aug', numberOfUnits: 5,
    }),
  ],
};

export const EnrollmentCTAWithManyUpcomingRounds: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courseRounds.getCourseApplication.query(() => mockApplication),
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => manyMockRounds),
      ],
    },
  },
};
