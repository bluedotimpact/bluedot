import type { Meta, StoryObj } from '@storybook/react';
import { TRPCError } from '@trpc/server';
import { createMockGroup } from '../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import FacilitatorSwitchModal from './FacilitatorSwitchModal';

const meta = {
  title: 'website/courses/FacilitatorSwitchModal',
  component: FacilitatorSwitchModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FacilitatorSwitchModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockSwitchingData = {
  groups: [createMockGroup({ id: 'group-1', groupName: 'Group 1' })],
  discussionsByGroup: {
    'group-1': [
      {
        id: 'discussion-1',
        label: 'Unit 1',
        startDateTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        endDateTime: Math.floor(Date.now() / 1000) + 5400, // 1.5 hours from now
        hasStarted: false,
      },
      {
        id: 'discussion-2',
        label: 'Unit 2',
        startDateTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
        endDateTime: Math.floor(Date.now() / 1000) + 5400, // 1.5 hours from now
        hasStarted: false,
      },
    ],
  },
};

export const Default: Story = {
  args: {
    handleClose: () => {},
    initialUnitNumber: '1',
    courseSlug: 'fish-test-course',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.discussionsAvailable.query(async () => {
          return mockSwitchingData;
        }),
      ],
    },
  },
};

export const Loading: Story = {
  args: {
    handleClose: () => {},
    initialUnitNumber: '1',
    courseSlug: 'fish-test-course',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.discussionsAvailable.query(async () => {
          return new Promise(() => {
            /* never resolves */
          });
        }),
      ],
    },
  },
};

export const Error: Story = {
  args: {
    handleClose: () => {},
    initialUnitNumber: '1',
    courseSlug: 'fish-test-course',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.discussionsAvailable.query(async () => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to fetch discussions' });
        }),
      ],
    },
  },
};
