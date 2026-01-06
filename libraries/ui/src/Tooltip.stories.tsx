import type { Meta, StoryObj } from '@storybook/react';
import { Tooltip } from './Tooltip';

const meta = {
  title: 'ui/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    content: 'This is a helpful tooltip that provides additional information to the user.',
  },
};

export const CustomTrigger: Story = {
  args: {
    content: 'This tooltip has a custom button trigger.',
    children: <button className="border rounded py-1 px-2 border-black cursor-pointer hover:opacity-80" type="button">custom trigger</button>,
  },
};
