import type { Meta, StoryObj } from '@storybook/react';
import { IoBan, IoCheckmark } from 'react-icons/io5';
import StatusPill, { GroupSwitchRequestedPill, ReschedulingPill } from './StatusPill';

const meta = {
  title: 'website/my-courses/StatusPill',
  component: StatusPill,
  parameters: { layout: 'padded' },
  args: { children: 'Attended', icon: <IoCheckmark aria-hidden size={14} /> },
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllPills: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-3">
        <StatusPill icon={<IoCheckmark aria-hidden size={14} />}>Attended</StatusPill>
        <StatusPill icon={<IoBan aria-hidden size={14} />}>Absent</StatusPill>
        <ReschedulingPill />
        <GroupSwitchRequestedPill />
      </div>
      {/* Same background as GroupDiscussionBanner */}
      <div className="flex gap-3 bg-[#E4EDFE] p-4">
        <ReschedulingPill emphasis="strong" />
      </div>
    </div>
  ),
};
