import type { Meta, StoryObj } from '@storybook/react';
import { TRPCError } from '@trpc/server';
import { createMockGroup, createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import FacilitatorSwitchModal from './FacilitatorSwitchModal';
import { ONE_DAY_SECONDS, ONE_HOUR_SECONDS, ONE_MINUTE_SECONDS } from '../../lib/constants';

const meta = {
  title: 'website/courses/FacilitatorSwitchModal',
  component: FacilitatorSwitchModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FacilitatorSwitchModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockGroup1 = createMockGroup({ id: 'group-1', groupName: 'Monday 9am ET' });
const mockGroup2 = createMockGroup({ id: 'group-2', groupName: 'Wednesday 2pm ET' });

const mockDiscussions = [
  // Group 1 discussions
  {
    ...createMockGroupDiscussion({
      id: 'discussion-1',
      group: 'group-1',
      startDateTime: Math.floor(Date.now() / 1000) - ONE_HOUR_SECONDS, // ended
      endDateTime: Math.floor(Date.now() / 1000) - 30 * ONE_MINUTE_SECONDS,
    }),
    groupDetails: mockGroup1,
    unitRecord: createMockUnit({ unitNumber: '1', title: 'Introduction' }),
  },
  {
    ...createMockGroupDiscussion({
      id: 'discussion-2',
      group: 'group-1',
      startDateTime: Math.floor(Date.now() / 1000) + ONE_HOUR_SECONDS,
      endDateTime: Math.floor(Date.now() / 1000) + 1.5 * ONE_HOUR_SECONDS,
    }),
    groupDetails: mockGroup1,
    unitRecord: createMockUnit({ unitNumber: '2', title: 'Advanced Topics' }),
  },
  {
    ...createMockGroupDiscussion({
      id: 'discussion-3',
      group: 'group-1',
      startDateTime: Math.floor(Date.now() / 1000) + 1.5 * ONE_HOUR_SECONDS,
      endDateTime: Math.floor(Date.now() / 1000) + 2 * ONE_HOUR_SECONDS,
    }),
    groupDetails: mockGroup1,
    unitRecord: createMockUnit({ unitNumber: '3', title: 'Conclusion' }),
  },
  // Group 2 discussions
  {
    ...createMockGroupDiscussion({
      id: 'discussion-4',
      group: 'group-2',
      startDateTime: Math.floor(Date.now() / 1000) + 2 * ONE_HOUR_SECONDS,
      endDateTime: Math.floor(Date.now() / 1000) + 2.5 * ONE_HOUR_SECONDS,
    }),
    groupDetails: mockGroup2,
    unitRecord: createMockUnit({ unitNumber: '1', title: 'Introduction' }),
  },
  {
    ...createMockGroupDiscussion({
      id: 'discussion-5',
      group: 'group-2',
      startDateTime: Math.floor(Date.now() / 1000) + ONE_DAY_SECONDS,
      endDateTime: Math.floor(Date.now() / 1000) + ONE_DAY_SECONDS + 30 * ONE_MINUTE_SECONDS,
    }),
    groupDetails: mockGroup2,
    unitRecord: createMockUnit({ unitNumber: '2', title: 'Advanced Topics' }),
  },
];

const mockFacilitators = [
  { value: 'facilitator-1', label: 'Alice Johnson' },
  { value: 'facilitator-2', label: 'Bob Smith' },
  { value: 'facilitator-3', label: 'Carol Williams' },
];

export const Default: Story = {
  args: {
    handleClose() {},
    roundId: 'mock-round-id',
    initialDiscussion: null,
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.discussionsAvailable.query(async () => {
          return mockDiscussions;
        }),
        trpcStorybookMsw.facilitators.updateDiscussion.mutation(async () => {
          return null;
        }),
        trpcStorybookMsw.facilitators.getFacilitatorsForRound.query(async () => {
          return mockFacilitators;
        }),
        trpcStorybookMsw.facilitators.requestFacilitatorChange.mutation(async () => {
          return null;
        }),
      ],
    },
  },
};

export const ChangeFacilitatorView: Story = {
  args: {
    handleClose() {},
    roundId: 'mock-round-id',
    initialDiscussion: mockDiscussions[1] ?? null,
    initialModalType: 'Change facilitator',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.discussionsAvailable.query(async () => {
          return mockDiscussions;
        }),
        trpcStorybookMsw.facilitators.updateDiscussion.mutation(async () => {
          return null;
        }),
        trpcStorybookMsw.facilitators.getFacilitatorsForRound.query(async () => {
          return mockFacilitators;
        }),
        trpcStorybookMsw.facilitators.requestFacilitatorChange.mutation(async () => {
          return null;
        }),
      ],
    },
  },
};

export const WithFetchedDiscussions: Story = {
  args: {
    handleClose() {},
    roundId: 'mock-round-id',
    initialDiscussion: { id: 'discussion-2', group: 'group-1' },
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.discussionsAvailable.query(async () => {
          return mockDiscussions;
        }),
        trpcStorybookMsw.facilitators.updateDiscussion.mutation(async () => {
          return null;
        }),
      ],
    },
  },
};

export const Loading: Story = {
  args: {
    handleClose() {},
    roundId: 'mock-round-id',
    initialDiscussion: null,
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
    handleClose() {},
    roundId: 'mock-round-id',
    initialDiscussion: null,
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
