import type { Meta, StoryObj } from '@storybook/react';
import QuickApplyPanel from './QuickApplyPanel';
import type { QuickApplyPanelCourse } from '../../server/routers/facilitator-applications';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const courses: QuickApplyPanelCourse[] = [
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

const meta = {
  title: 'website/facilitator-applications/QuickApplyPanel',
  component: QuickApplyPanel,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof QuickApplyPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    msw: {
      handlers: [trpcStorybookMsw.facilitatorApplications.quickApplyPanel.query(() => courses)],
    },
  },
};

export const MultipleRounds: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitatorApplications.quickApplyPanel.query(() => [
          {
            courseId: 'course-tais',
            courseTitle: 'Technical AI Safety',
            courseSlug: 'technical-ai-safety',
            rounds: [
              {
                id: 'round-1',
                label: 'Week 25 Intensive',
                firstDiscussionDate: '2026-03-10',
                lastDiscussionDate: '2026-03-17',
              },
              {
                id: 'round-2',
                label: 'Week 26 Intensive',
                firstDiscussionDate: '2026-03-17',
                lastDiscussionDate: '2026-03-24',
              },
              {
                id: 'round-3',
                label: 'Week 27 Intensive',
                firstDiscussionDate: '2026-03-24',
                lastDiscussionDate: '2026-03-31',
              },
            ],
          },
        ]),
      ],
    },
  },
};
