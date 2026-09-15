import type { Meta, StoryObj } from '@storybook/react';
import { IoCheckmark } from 'react-icons/io5';

import { Tag } from './Tag';

const meta = {
  title: 'ui/Tag',
  component: Tag,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Label',
  },
};

export const Accent: Story = {
  args: {
    children: 'New',
    tone: 'accent',
  },
};

export const Status: Story = {
  args: {
    children: (
      <>
        <IoCheckmark aria-hidden />
        Attended
      </>
    ),
    tone: 'status',
    shape: 'pill',
  },
};

export const Pill: Story = {
  args: {
    children: 'Weekly',
    shape: 'pill',
  },
};

export const AllVariants: Story = {
  args: { children: null },
  render: () => (
    <div className="grid w-fit grid-cols-3 gap-4">
      <Tag>Neutral</Tag>
      <Tag tone="accent">Accent</Tag>
      <Tag tone="status"><IoCheckmark aria-hidden />Status</Tag>
      <Tag shape="pill">Neutral</Tag>
      <Tag tone="accent" shape="pill">Accent</Tag>
      <Tag tone="status" shape="pill"><IoCheckmark aria-hidden />Status</Tag>
    </div>
  ),
};
