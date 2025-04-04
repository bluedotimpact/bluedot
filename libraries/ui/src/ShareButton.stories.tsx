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

export const Customized: Story = {
  args: {
    url: 'https://example.com/custom-page',
    text: 'Check out this awesome page!',
    children: 'Share this content',
  },
};

export const WithFunction: Story = {
  args: {
    url: () => 'https://example.com/generated-url',
    children: 'Share synchronously generated URL',
  },
  parameters: {
    docs: {
      source: {
        transform: (source: string) => `const myFunc = () => 'https://example.com/async-generated-url';
  
${source.replace('() => {}', 'myFunc')}`,
      },
    },
  },
};

export const WithAsyncFunction: Story = {
  args: {
    url: () => new Promise((resolve) => {
      setTimeout(() => resolve('https://example.com/async-generated-url'), 2000);
    }),
    children: 'Share asynchronously generated URL',
  },
  parameters: {
    docs: {
      source: {
        transform: (source: string) => `const myFunc = () => new Promise((resolve) => {
  setTimeout(() => resolve('https://example.com/async-generated-url'), 2000);
})
  
${source.replace('() => {}', 'myFunc')}`,
      },
    },
  },
};
