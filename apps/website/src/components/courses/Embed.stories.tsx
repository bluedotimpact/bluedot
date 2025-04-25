import type { Meta, StoryObj } from '@storybook/react';

import Embed from './Embed';

const meta = {
  title: 'website/Embed',
  component: Embed,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {},
} satisfies Meta<typeof Embed>;

export default meta;
type Story = StoryObj<typeof meta>;

export const YouTubeEmbed: Story = {
  name: 'YouTube Embed',
  args: {
    url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  },
};

export const DemoEmbed: Story = {
  args: {
    url: 'https://course-demos.k8s.bluedot.org/generate-react-component',
  },
};

export const SunoEmbed: Story = {
  args: {
    url: 'https://suno.com/embed/e02aebab-1fe8-4b64-b849-7393e01eeafd',
    className: '!h-40',
  },
};

export const WebsiteEmbed: Story = {
  args: {
    url: 'https://example.com',
  },
};

export const CustomStyleEmbed: Story = {
  args: {
    url: 'https://example.com',
    className: 'invert !w-1/2 my-24 mx-auto rotate-30',
  },
};
