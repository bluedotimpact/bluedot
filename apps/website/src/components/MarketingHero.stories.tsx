import type { Meta, StoryObj } from '@storybook/react';
import MarketingHero from './MarketingHero';

const meta = {
  title: 'website/MarketingHero',
  component: MarketingHero,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Top-of-page hero used by /about, /our-community, /join-us, /grants and similar marketing pages. Renders its own transparent Nav and a full-bleed background image.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Main heading text',
      control: 'text',
    },
    subtitle: {
      description: 'Optional subtitle paragraph below the heading',
      control: 'text',
    },
    extraTopSpacing: {
      description: 'Reserve extra space below the nav for titles that wrap to two lines (e.g. missions)',
      control: 'boolean',
    },
  },
} satisfies Meta<typeof MarketingHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const About: Story = {
  args: {
    title: 'About us',
    subtitle: 'Building the workforce that protects humanity',
  },
};

export const JoinUs: Story = {
  args: {
    title: 'Work with us',
    subtitle: 'AI safety needs thousands more people. We need the team that gets them there.',
  },
};

export const TitleOnly: Story = {
  args: {
    title: 'Our community',
  },
};

// Mirrors a mission detail page, where titles routinely wrap to two lines.
export const TwoLineTitle: Story = {
  args: {
    title: 'US Public Support for Biodefense',
    subtitle: 'Build an organization whose mission is to effectively raise US public support for biodefense.',
    extraTopSpacing: true,
  },
};
