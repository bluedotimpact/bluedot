import type { Meta, StoryObj } from '@storybook/react';

import { ValueCard } from './ValueCard';

const meta = {
  title: 'ui/ValueCard',
  component: ValueCard,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ValueCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: '/icons/test-icon.svg',
    title: 'Test Title',
    description: '"If there\'s no meaning in it," said the King, "that saves a world of trouble, you know, as we needn\'t try to find any. And yet I don\'t know," he went on; "I seem to see some meaning in them, after all."',
  },
};
