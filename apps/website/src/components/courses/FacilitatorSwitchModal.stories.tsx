import type { Meta, StoryObj } from '@storybook/react';
import { createMockGroup, createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';
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

const mockGroup1 = createMockGroup({ id: 'group-1', groupName: 'Monday 9am ET' });
const mockGroup2 = createMockGroup({ id: 'group-2', groupName: 'Wednesday 2pm ET' });

const mockDiscussions = [
  // Group 1 discussions
  {
    ...createMockGroupDiscussion({
      id: 'discussion-1',
      group: 'group-1',
      startDateTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      endDateTime: Math.floor(Date.now() / 1000) - 1800, // .5 hours ago
    }),
    groupDetails: mockGroup1,
    unitRecord: createMockUnit({ unitNumber: '1', title: 'Introduction' }),
  },
  {
    ...createMockGroupDiscussion({
      id: 'discussion-2',
      group: 'group-1',
      startDateTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      endDateTime: Math.floor(Date.now() / 1000) + 5400, // 1.5 hours from now
    }),
    groupDetails: mockGroup1,
    unitRecord: createMockUnit({ unitNumber: '2', title: 'Advanced Topics' }),
  },
  {
    ...createMockGroupDiscussion({
      id: 'discussion-3',
      group: 'group-1',
      startDateTime: Math.floor(Date.now() / 1000) + 5400, // 1.5 hours from now
      endDateTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
    }),
    groupDetails: mockGroup1,
    unitRecord: createMockUnit({ unitNumber: '3', title: 'Conclusion' }),
  },
  // Group 2 discussions
  {
    ...createMockGroupDiscussion({
      id: 'discussion-4',
      group: 'group-2',
      startDateTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
      endDateTime: Math.floor(Date.now() / 1000) + 9000, // 2.5 hours from now
    }),
    groupDetails: mockGroup2,
    unitRecord: createMockUnit({ unitNumber: '1', title: 'Introduction' }),
  },
  {
    ...createMockGroupDiscussion({
      id: 'discussion-5',
      group: 'group-2',
      startDateTime: Math.floor(Date.now() / 1000) + 86400, // 1 day from now
      endDateTime: Math.floor(Date.now() / 1000) + 88200, // 1 day + .5 hours from now
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
    handleClose: () => {},
    courseSlug: 'fish-test-course',
    initialDiscussion: null,
    allDiscussions: mockDiscussions,
  },
  parameters: {
    msw: {
      handlers: [
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
    handleClose: () => {},
    courseSlug: 'fish-test-course',
    initialDiscussion: mockDiscussions[1] ?? null,
    allDiscussions: mockDiscussions,
    initialModalType: 'Change facilitator',
  },
  parameters: {
    msw: {
      handlers: [
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
