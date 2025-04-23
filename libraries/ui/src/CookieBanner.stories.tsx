import type { Meta, StoryObj } from '@storybook/react';

import { CookieBanner } from './CookieBanner';

const meta = {
  title: 'ui/CookieBanner',
  component: CookieBanner,
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  render: (args) => <div className="min-h-60"><CookieBanner {...args} /></div>,
} satisfies Meta<typeof CookieBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
