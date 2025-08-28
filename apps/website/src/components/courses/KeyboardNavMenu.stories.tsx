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

export const CustomShortcuts: Story = {
  args: {
    shortcuts: [
      { action: 'Save', keys: ['Ctrl/Cmd', 'S'] },
      { action: 'Copy', keys: ['Ctrl/Cmd', 'C'] },
      { action: 'Help', keys: ['?'] },
    ],
  },
};

export const CustomTitle: Story = {
  args: {
    popoverTitle: 'Keyboard shortcuts',
  },
};
