import type { Meta, StoryObj } from '@storybook/react';

import { Collapsible } from './Collapsible';

const meta = {
  title: 'ui/Collapsible',
  component: Collapsible,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Is this collapsible?',
    children: [
      <p key="answer">Yes, it is!</p>,
    ],
  },
};
