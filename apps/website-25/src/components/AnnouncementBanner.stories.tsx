import type { Meta, StoryObj } from '@storybook/react';

import { AnnouncementBanner } from './AnnouncementBanner';

const meta = {
  title: 'website/AnnouncementBanner',
  component: AnnouncementBanner,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  args: {
    children: 'Something is happening',
  },
} satisfies Meta<typeof AnnouncementBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithCta: Story = {
  args: {
    ctaUrl: 'https://lu.ma/aisafetycommunityevents',
  },
};

export const CustomContent: Story = {
  args: {
    children: 'AI Safety Workshop',
    ctaText: 'Sign Up',
    ctaUrl: 'https://lu.ma/aisafetycommunityevents',
  },
};

export const CustomJSXContent: Story = {
  args: {
    children: <>This is some <span className="font-bold">custom</span> content</>,
    ctaText: 'Sign Up',
    ctaUrl: 'https://lu.ma/aisafetycommunityevents',
  },
};
