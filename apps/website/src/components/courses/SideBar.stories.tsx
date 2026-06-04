import type { Meta, StoryObj } from '@storybook/react';
import { loggedInStory, loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import SideBar from './SideBar';
import {
  mockUnits,
  mockChunks,
  defaultProgressHandlers,
  someProgressHandlers,
  allCompletedHandlers,
} from './courseSidebarStoryFixtures';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta: Meta<typeof SideBar> = {
  title: 'Courses/SideBar',
  component: SideBar,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: defaultProgressHandlers,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '100vh', display: 'flex' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    courseTitle: 'AI Safety Fundamentals',
    courseSlug: 'ai-safety',
    units: mockUnits,
    currentUnitNumber: 1,
    currentChunkIndex: 0,
    onChunkSelect() {},
    unitChunks: mockChunks,
  },
  ...loggedOutStory(),
};

export default meta;
type Story = StoryObj<typeof SideBar>;

export const LoggedOut: Story = {};

export const LoggedInNoProgress: Story = {
  ...loggedInStory(),
};

export const LoggedInSomeProgress: Story = {
  ...loggedInStory(),
  parameters: {
    msw: {
      handlers: someProgressHandlers,
    },
  },
};

export const LoggedInAllCompleted: Story = {
  ...loggedInStory(),
  parameters: {
    msw: {
      handlers: allCompletedHandlers,
    },
  },
};

export const OnSecondUnit: Story = {
  ...loggedInStory(),
  args: {
    currentUnitNumber: 2,
    currentChunkIndex: 0,
  },
};

// Facilitator wrapping up this course: the certificate panel is replaced by the
// pinned "facilitate again" quick-apply CTA at the bottom of the sidebar.
export const Facilitator: Story = {
  ...loggedInStory(),
  args: {
    certificateData: { status: 'is-facilitator' },
  },
  parameters: {
    msw: {
      handlers: [
        ...defaultProgressHandlers,
        trpcStorybookMsw.facilitatorApplications.eligibleRounds.query(() => [
          {
            courseId: 'course-1',
            courseTitle: 'AI Safety Fundamentals',
            courseSlug: 'ai-safety',
            rounds: [
              {
                id: 'round-1',
                label: 'Week 28 Intensive',
                firstDiscussionDate: '2026-04-07',
                lastDiscussionDate: '2026-04-14',
              },
            ],
          },
        ]),
      ],
    },
  },
};
