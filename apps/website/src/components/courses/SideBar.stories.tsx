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
    onChunkSelect: () => {},
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

export const WithApplyCTA: Story = {
  ...loggedInStory(),
  args: {
    applyCTAProps: {
      applicationDeadline: 'Jan 15',
      applicationUrl: 'https://example.com/apply',
      hasApplied: false,
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
