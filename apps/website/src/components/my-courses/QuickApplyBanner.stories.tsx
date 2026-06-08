import type { Meta, StoryObj } from '@storybook/react';
import { loggedInStory } from '@bluedot/ui/src/utils/storybook';
import { QuickApplyBanner } from './QuickApplyBanner';
import type { EligibleRoundsCourse } from '../../server/routers/facilitator-applications';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const eligibleCourses: EligibleRoundsCourse[] = [
  {
    courseId: 'course-agi',
    courseTitle: 'AGI Strategy',
    courseSlug: 'agi-strategy',
    rounds: [
      {
        id: 'round-1',
        label: 'Week 28 Intensive',
        firstDiscussionDate: '2026-04-07',
        lastDiscussionDate: '2026-04-14',
      },
    ],
  },
];

const eligibleRoundsHandler = (courses: EligibleRoundsCourse[]) =>
  trpcStorybookMsw.facilitatorApplications.eligibleRounds.query(() => courses);

const meta = {
  title: 'My Courses/QuickApplyBanner',
  component: QuickApplyBanner,
  parameters: { layout: 'padded' },
  ...loggedInStory(),
} satisfies Meta<typeof QuickApplyBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Facilitator wrapping up a course with an open round to apply to: the banner renders.
export const Default: Story = {
  parameters: {
    msw: { handlers: [eligibleRoundsHandler(eligibleCourses)] },
  },
};

// No eligible round: the banner renders nothing.
export const NotEligible: Story = {
  parameters: {
    msw: { handlers: [eligibleRoundsHandler([])] },
  },
};
