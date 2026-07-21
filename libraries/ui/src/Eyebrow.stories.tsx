import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from 'react';

import { Eyebrow } from './Eyebrow';

const meta = {
  title: 'ui/Eyebrow',
  component: Eyebrow,
  tags: ['autodocs'],
} satisfies Meta<typeof Eyebrow>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Unit 1: Racing to a better future',
  },
};

// Override the colour for on-dark or muted contexts via className.
export const OnDark: Story = {
  render: () => (
    <div className="bg-bluedot-navy p-6">
      <Eyebrow className="text-white/70">Self-paced course</Eyebrow>
    </div>
  ),
};

export const Muted: Story = {
  args: {
    children: 'More stories',
    className: 'text-bluedot-navy/60',
  },
};

// Computed colours (course accents) pass through the style prop.
export const DynamicAccent: Story = {
  args: {
    children: 'Start making impact today',
    style: { color: '#a32e00' },
  },
};
