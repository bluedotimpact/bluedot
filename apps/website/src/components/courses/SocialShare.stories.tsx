import type { Meta, StoryObj } from '@storybook/react';

import SocialShare from './SocialShare';

const meta = {
  title: 'website/courses/SocialShare',
  component: SocialShare,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof SocialShare>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    coursePath: '/courses/future-of-ai',
    text: 'This is my custom text for this course!',
  },
};
