import type { Meta, StoryObj } from '@storybook/react';
import { TRPCError } from '@trpc/server';
import { createMockGroup, createMockGroupDiscussion } from '../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import type { DiscussionsAvailable } from '../../server/routers/group-switching';
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

const mockSwitchingData: DiscussionsAvailable = {
  groupsAvailable: [
    {
      group: createMockGroup({
        id: 'group-1',
        groupName: 'Morning Group A',
        startTimeUtc: Math.floor(new Date('2024-01-01T09:00:00Z').getTime() / 1000), // 9:00 AM UTC
      }),
      userIsParticipant: true,
      spotsLeftIfKnown: 0,
      allDiscussionsHaveStarted: false,
    },
    {
      group: createMockGroup({
        id: 'group-2',
        groupName: 'Evening Group B',
        startTimeUtc: Math.floor(new Date('2024-01-01T19:00:00Z').getTime() / 1000), // 7:00 PM UTC
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 3,
      allDiscussionsHaveStarted: false,
    },
    {
      group: createMockGroup({
        id: 'group-3',
        groupName: 'Weekend Group C',
        startTimeUtc: Math.floor(new Date('2024-01-06T14:00:00Z').getTime() / 1000), // Saturday 2:00 PM UTC
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 0,
      allDiscussionsHaveStarted: false,
    },
  ],
  discussionsAvailable: {
    1: [
      {
        discussion: createMockGroupDiscussion({
          startDateTime: Math.floor((Date.now() + 2 * 60 * 60 * 1000) / 1000), // 2 hours from now
        }),
        groupName: 'Morning Group A',
        userIsParticipant: true,
        spotsLeftIfKnown: 0,
        hasStarted: false,
      },
      {
        discussion: createMockGroupDiscussion({
          startDateTime: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours from now
        }),
        groupName: 'Evening Group B',
        userIsParticipant: false,
        spotsLeftIfKnown: 2,
        hasStarted: false,
      },
    ],
    2: [
      {
        discussion: createMockGroupDiscussion({
          startDateTime: Math.floor((Date.now() + 48 * 60 * 60 * 1000) / 1000), // 48 hours from now
        }),
        groupName: 'Weekend Group C',
        userIsParticipant: false,
        spotsLeftIfKnown: 1,
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
