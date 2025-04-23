import type { Meta, StoryObj } from '@storybook/react';
import HomeHeroContent from './HomeHeroContent';

const meta = {
  title: 'Website/HomeHeroContent',
  component: HomeHeroContent,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HomeHeroContent>;

export default meta;
type Story = StoryObj<typeof HomeHeroContent>;

export const Default: Story = {
  args: {},
};
