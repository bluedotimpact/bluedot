import type { Meta, StoryObj } from '@storybook/react';

import KeyboardNav from './KeyboardNav';

const meta = {
  title: 'website/KeyboardNav',
  component: KeyboardNav,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {},
} satisfies Meta<typeof KeyboardNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
