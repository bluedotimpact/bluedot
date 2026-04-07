import type { Meta, StoryObj } from '@storybook/react';
import { loggedInStory, loggedOutStory } from '@bluedot/ui/src/utils/storybook';
import { MobileCourseModal } from './MobileCourseModal';
import {
  mockUnits,
  mockChunks,
  defaultProgressHandlers,
  someProgressHandlers,
  allCompletedHandlers,
} from './courseSidebarStoryFixtures';

const meta: Meta<typeof MobileCourseModal> = {
  title: 'Courses/MobileCourseModal',
  component: MobileCourseModal,
  parameters: {
    layout: 'fullscreen',
    viewport: {
      defaultViewport: 'mobile1',
    },
    msw: {
      handlers: defaultProgressHandlers,
    },
  },
  args: {
    isOpen: true,
    setIsOpen() {},
    courseTitle: 'AI Safety Fundamentals',
    courseSlug: 'ai-safety',
    units: mockUnits,
    currentUnitNumber: 1,
    currentChunkIndex: 0,
    onChunkSelect() {},
    onUnitSelect() {},
    unitChunks: mockChunks,
  },
  ...loggedOutStory(),
};

export default meta;
type Story = StoryObj<typeof MobileCourseModal>;

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
