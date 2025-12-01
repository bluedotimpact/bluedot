import type { Meta, StoryObj } from '@storybook/react';
import OurCommunitySection from './OurCommunitySection';

const meta = {
  title: 'Website/Homepage/OurCommunitySection',
  component: OurCommunitySection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The community section of the homepage featuring an infinite-scrolling carousel of community member cards. Auto-scrolls and pauses on hover, with manual navigation controls.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof OurCommunitySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
