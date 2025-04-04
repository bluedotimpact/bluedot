import type { Meta, StoryObj } from '@storybook/react';
import { ShareButton } from './ShareButton';

const meta = {
  title: 'ui/ShareButton',
  component: ShareButton,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ShareButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCustomText: Story = {
  args: {
    children: 'Share this content',
  },
};

export const WithCustomUrl: Story = {
  args: {
    url: 'https://example.com/custom-page',
    text: 'Check out this awesome page!',
  },
};

export const WithFunction: Story = {
  args: {
    url: () => 'https://example.com/generated-url',
    text: 'Share synchronously generated URL',
  },
};

export const WithAsyncFunction: Story = {
  args: {
    url: () => new Promise((resolve) => {
      setTimeout(() => resolve('https://example.com/async-generated-url'), 2000);
    }),
    children: 'Share asynchronously generated URL',
  },
};
