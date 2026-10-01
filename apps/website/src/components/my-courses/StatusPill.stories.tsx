import type { Meta, StoryObj } from '@storybook/react';
import { FaCheck } from 'react-icons/fa6';
import { IoBan, IoCheckmark } from 'react-icons/io5';
import StatusPill from './StatusPill';

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
    <div className="flex flex-wrap gap-3">
      <StatusPill icon={<IoCheckmark aria-hidden size={14} />}>Attended</StatusPill>
      <StatusPill icon={<IoBan aria-hidden size={14} />}>Absent</StatusPill>
      <StatusPill icon={<IoBan aria-hidden size={14} />}>Dropped</StatusPill>
      <StatusPill>3 Attending</StatusPill>
      <StatusPill icon={<FaCheck aria-hidden size={12} />}>Facilitated</StatusPill>
    </div>
  ),
};
