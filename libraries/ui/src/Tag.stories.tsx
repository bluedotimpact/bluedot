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

export const Pill: Story = {
  args: {
    children: 'Weekly',
    shape: 'pill',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <IoCheckmark aria-hidden />
        Attended
      </>
    ),
    shape: 'pill',
  },
};

export const AllVariants: Story = {
  args: { children: null },
  render: () => (
    <div className="grid w-fit grid-cols-2 gap-4">
      <Tag>Neutral</Tag>
      <Tag tone="accent">Accent</Tag>
      <Tag shape="pill"><IoCheckmark aria-hidden />Neutral</Tag>
      <Tag tone="accent" shape="pill"><IoCheckmark aria-hidden />Accent</Tag>
    </div>
  ),
};
