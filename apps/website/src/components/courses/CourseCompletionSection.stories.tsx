import { loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import type { Meta, StoryObj } from '@storybook/react';
import { createMockRound } from '../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import CourseCompletionSection from './CourseCompletionSection';

const mockApplyCTAProps = {
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
        trpcStorybookMsw.courseRounds.getApplyCTAProps.query(() => mockApplyCTAProps),
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => mockRounds),
      ],
    },
  },
};
