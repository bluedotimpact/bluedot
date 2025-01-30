import type { Meta, StoryObj } from '@storybook/react';

import { CTALinkOrButton } from './CTALinkOrButton';

const meta = {
  title: 'ui/CTALinkOrButton',
  component: CTALinkOrButton,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    children: 'Testing',
    variant: 'primary',
    withChevron: false,
    url: '',
    isExternalUrl: false,
  },
} satisfies Meta<typeof CTALinkOrButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Button: Story = {
  args: {
    children: 'Button',
    variant: 'primary',
    withChevron: true,
  },
};

export const Link: Story = {
  args: {
    children: 'Link',
    variant: 'primary',
    withChevron: false,
    url: 'https://www.google.com',
    isExternalUrl: false,
  },
};
