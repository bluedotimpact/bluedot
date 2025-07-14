import type { Meta, StoryObj } from '@storybook/react';

import FoAICongratulations from './FoAICongratulations';

const meta = {
  title: 'website/courses/FoAICongratulations',
  component: FoAICongratulations,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof FoAICongratulations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithClassName: Story = {
  args: {
    className: 'max-w-2xl mx-auto',
  },
};
