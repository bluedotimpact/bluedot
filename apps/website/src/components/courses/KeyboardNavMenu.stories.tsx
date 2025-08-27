import type { Meta, StoryObj } from '@storybook/react';

import KeyboardNavMenu from './KeyboardNavMenu';

const meta = {
  title: 'website/KeyboardNavMenu',
  component: KeyboardNavMenu,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {},
} satisfies Meta<typeof KeyboardNavMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
