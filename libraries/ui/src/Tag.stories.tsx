import type { Meta, StoryObj } from '@storybook/react';

import { Tag } from './Tag';

const meta = {
  title: 'ui/Tag',
  component: Tag,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    className: '',
    label: '',
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CrashCourse: Story = {
  args: {
    label: 'Crash course',
  },
};

export const InDepthCourse: Story = {
  args: {
    label: 'In-depth course',
  },
};