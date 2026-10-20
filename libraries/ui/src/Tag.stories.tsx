import type { Meta, StoryObj } from '@storybook/react';
import { FaCheck } from 'react-icons/fa6';

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
    children: 'New',
  },
};

export const Pill: Story = {
  args: {
    children: '3 Attending',
    shape: 'pill',
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <FaCheck aria-hidden />
        Attended
      </>
    ),
    shape: 'pill',
  },
};

export const AllVariants: Story = {
  args: { children: null },
  render: () => (
    <div className="flex w-fit items-center gap-4">
      <Tag>Start Here</Tag>
      <Tag shape="pill"><FaCheck aria-hidden />Attended</Tag>
    </div>
  ),
};
