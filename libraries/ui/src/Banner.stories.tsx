import type { Meta, StoryObj } from '@storybook/react';

import { Banner } from './Banner';

const meta = {
  title: 'ui/Banner',
  component: Banner,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    title: '',
    inputPlaceholder: '',
    buttonText: '',
    showInput: false,
    showButton: false,
  },
} satisfies Meta<typeof Banner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'This is a banner',
  },
};

export const WithInput: Story = {
  args: {
    title: 'This is a banner',
    inputPlaceholder: 'Test input',
    buttonText: 'Test button',
    showInput: true,
    showButton: true,
  },
};
