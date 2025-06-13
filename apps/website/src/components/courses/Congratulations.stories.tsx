import type { Meta, StoryObj } from '@storybook/react';

import Congratulations from './Congratulations';

const meta = {
  title: 'website/courses/Congratulations',
  component: Congratulations,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof Congratulations>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    courseTitle: 'Future of AI',
    coursePath: '/courses/future-of-ai',
    text: '',
  },
};
