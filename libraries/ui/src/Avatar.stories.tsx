import type { Meta, StoryObj } from '@storybook/react';
import { Avatar } from './Avatar';

const meta = {
  title: 'ui/Avatar',
  component: Avatar,
  tags: ['autodocs'],
} satisfies Meta<typeof Avatar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    name: 'Clara Ndubuisi',
  },
};

export const Photo: Story = {
  args: {
    name: 'Clara Ndubuisi',
    imageSrc: 'https://i.pravatar.cc/160?img=5',
    size: 'medium',
  },
};

export const Sizes: Story = {
  args: { name: 'Clara Ndubuisi' },
  render: () => (
    <div className="flex items-end gap-6">
      <Avatar name="Clara Ndubuisi" size="small" />
      <Avatar name="Clara Ndubuisi" size="medium" />
      <Avatar name="Clara Ndubuisi" size="large" />
    </div>
  ),
};

export const BrokenImageFallback: Story = {
  args: {
    name: 'Clara Ndubuisi',
    imageSrc: 'https://example.com/does-not-exist.jpg',
    size: 'medium',
  },
};
