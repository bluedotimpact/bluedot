import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { delay } from 'msw';
import { ONE_HOUR_SECONDS } from '../../lib/constants';
import RejoinGroupModal from './RejoinGroupModal';
import type { DiscussionsAvailable } from '../../server/routers/group-switching';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { createMockGroup } from '../../__tests__/testUtils';

const mockAvailableGroups: DiscussionsAvailable = {
  groupsAvailable: [
    {
      group: createMockGroup({
        id: 'group-1',
        groupName: 'Group 01: Mahatma Gandhi',
        startTimeUtc: Math.floor(new Date('2024-10-19T13:00:00Z').getTime() / 1000),
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 3,
    },
    {
      group: createMockGroup({
        id: 'group-2',
        groupName: 'Group 03: Alexei Navalny',
        startTimeUtc: Math.floor(new Date('2024-10-19T16:00:00Z').getTime() / 1000),
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 2,
    },
    {
      group: createMockGroup({
        id: 'group-3',
        groupName: 'Group 04: Malala Yousafzai',
        startTimeUtc: Math.floor(new Date('2024-10-19T17:00:00Z').getTime() / 1000),
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 1,
    },
  ],
  discussionsAvailable: {},
};

const mockNoSpotsGroups: DiscussionsAvailable = {
  groupsAvailable: [
    {
      group: createMockGroup({
        id: 'group-full-1',
        groupName: 'Group 01: Mahatma Gandhi',
        startTimeUtc: Math.floor(new Date('2024-10-19T13:00:00Z').getTime() / 1000),
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 0,
    },
    {
      group: createMockGroup({
        id: 'group-full-2',
        groupName: 'Group 03: Alexei Navalny',
        startTimeUtc: Math.floor(new Date('2024-10-19T16:00:00Z').getTime() / 1000),
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 0,
    },
  ],
  discussionsAvailable: {},
};

const mockManyGroups: DiscussionsAvailable = {
  groupsAvailable: [
    'Group 01: Alan Turing',
    'Group 02: Ada Lovelace',
    'Group 03: Marie Curie',
    'Group 04: Richard Feynman',
    'Group 05: Rosalind Franklin',
    'Group 06: Nikola Tesla',
  ].map((groupName, i) => ({
    group: createMockGroup({
      id: `group-${i + 1}`,
      groupName,
      startTimeUtc: Math.floor(new Date('2024-10-19T13:00:00Z').getTime() / 1000) + i * ONE_HOUR_SECONDS * 3,
    }),
    userIsParticipant: false,
    spotsLeftIfKnown: i === 2 ? 0 : i + 1,
  })),
  discussionsAvailable: {},
};

const meta = {
  title: 'website/courses/RejoinGroupModal',
  component: RejoinGroupModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RejoinGroupModal>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  handleClose() {},
  roundId: 'round-1',
};

export const Default: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(() => mockAvailableGroups),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => null),
      ],
    },
  },
};

export const NoAvailableGroups: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(() => ({
          groupsAvailable: [],
          discussionsAvailable: {},
        })),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => null),
      ],
    },
  },
};

export const AllGroupsFull: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(() => mockNoSpotsGroups),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => null),
      ],
    },
  },
};

export const ManyGroups: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(() => mockManyGroups),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => null),
      ],
    },
  },
};

export const Loading: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(async () => {
          await delay(2000);
          return mockAvailableGroups;
        }),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => null),
      ],
    },
  },
};
