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

const mockGroup = createMockGroup({ id: 'group-1', groupName: 'Group 1' });

const mockDiscussions = [
  {
    ...createMockGroupDiscussion({
      id: 'discussion-1',
      group: 'group-1',
      startDateTime: Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
      endDateTime: Math.floor(Date.now() / 1000) - 1800, // .5 hours ago
    }),
    groupDetails: mockGroup,
    unitRecord: createMockUnit({ unitNumber: '1', title: 'Introduction' }),
  },
  {
    ...createMockGroupDiscussion({
      id: 'discussion-2',
      group: 'group-1',
      startDateTime: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      endDateTime: Math.floor(Date.now() / 1000) + 5400, // 1.5 hours from now
    }),
    groupDetails: mockGroup,
    unitRecord: createMockUnit({ unitNumber: '2', title: 'Advanced Topics' }),
  },
  {
    ...createMockGroupDiscussion({
      id: 'discussion-3',
      group: 'group-1',
      startDateTime: Math.floor(Date.now() / 1000) + 5400, // 1.5 hours from now
      endDateTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
    }),
    groupDetails: mockGroup,
    unitRecord: createMockUnit({ unitNumber: '3', title: 'Conclusion' }),
  },
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
      ],
    },
  },
};
