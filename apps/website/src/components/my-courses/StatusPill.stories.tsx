import type { Meta, StoryObj } from '@storybook/react';
import { FaCheck } from 'react-icons/fa6';
import { FaBan, FaCheck } from 'react-icons/fa6';
import StatusPill from './StatusPill';

const meta = {
  title: 'website/my-courses/StatusPill',
  component: StatusPill,
  parameters: { layout: 'padded' },
  args: { children: 'Attended', icon: <FaCheck aria-hidden className="size-3" /> },
} satisfies Meta<typeof StatusPill>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AllPills: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <StatusPill icon={<FaCheck aria-hidden className="size-3" />}>Attended</StatusPill>
      <StatusPill icon={<FaBan aria-hidden className="size-3.5" />}>Absent</StatusPill>
      <StatusPill icon={<FaBan aria-hidden className="size-3.5" />}>Dropped</StatusPill>
      <StatusPill>3 Attending</StatusPill>
      <StatusPill icon={<FaCheck aria-hidden size={12} />}>Facilitated</StatusPill>
    </div>
  ),
};
