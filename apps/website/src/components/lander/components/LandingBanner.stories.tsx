import type { Meta, StoryObj } from '@storybook/react';
import LandingBanner from './LandingBanner';

const meta = {
  title: 'website/CourseLander/LandingBanner',
  component: LandingBanner,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A full-width call-to-action banner with a background image, noise texture overlay, icon, title, and CTA button. Used at the bottom of course landers to drive conversions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Main heading text displayed in the banner',
      control: 'text',
    },
    ctaText: {
      description: 'Text for the call-to-action button',
      control: 'text',
    },
    ctaUrl: {
      description: 'URL the CTA button links to',
      control: 'text',
    },
    imageSrc: {
      description: 'Background image URL',
      control: 'text',
    },
    imageAlt: {
      description: 'Alt text for the background image',
      control: 'text',
    },
    iconSrc: {
      description: 'URL for the icon displayed above the title',
      control: 'text',
    },
    iconAlt: {
      description: 'Alt text for the icon',
      control: 'text',
    },
    noiseImageSrc: {
      description: 'URL for the noise texture overlay image',
      control: 'text',
    },
  },
} satisfies Meta<typeof LandingBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Start building towards a good future today',
    ctaText: 'Apply now',
    ctaUrl: 'https://example.com/apply',
    imageSrc: '/images/agi-strategy/hero-banner-split.png',
    imageAlt: 'AGI Strategy banner',
    iconSrc: '/images/agi-strategy/bluedot-icon.svg',
    iconAlt: 'BlueDot',
    noiseImageSrc: '/images/agi-strategy/noise.webp',
  },
};
