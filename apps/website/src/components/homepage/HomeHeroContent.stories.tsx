import type { Meta, StoryObj } from '@storybook/react';
import HomeHeroContent from './HomeHeroContent';

const meta = {
  title: 'Website/Homepage/HomeHeroContent',
  component: HomeHeroContent,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The hero section of the homepage featuring a large background image, headline text, and the GraduateSection alumni carousel.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HomeHeroContent>;

export default meta;
type Story = StoryObj<typeof HomeHeroContent>;

export const Default: Story = {
  args: {},
};
