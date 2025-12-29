import type { Meta, StoryObj } from '@storybook/react';
import HeroSection from './HeroSection';

const meta = {
  title: 'website/CourseLander/HeroSection',
  component: HeroSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A responsive hero section component for the AGI Strategy course landing page with a split-layout design.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    categoryLabel: {
      description: 'Optional category label displayed above the title',
      control: 'text',
    },
    title: {
      description: 'Main heading text',
      control: 'text',
    },
    description: {
      description: 'Description paragraph text',
      control: 'text',
    },
    primaryCta: {
      description: 'Primary call-to-action button configuration',
      control: 'object',
    },
    secondaryCta: {
      description: 'Secondary call-to-action button configuration',
      control: 'object',
    },
    imageSrc: {
      description: 'URL path to the image displayed on the right/top',
      control: 'text',
    },
    imageAlt: {
      description: 'Alt text for the image',
      control: 'text',
    },
    gradient: {
      description: 'CSS gradient background for gradient hero variants',
      control: 'text',
    },
    accentColor: {
      description: 'Accent color for category label and CTAs in dark theme',
      control: 'color',
    },
  },
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with all props including image
export const Default: Story = {
  args: {
    categoryLabel: 'AGI STRATEGY',
    title: "AGI Strategy – Learn how to navigate humanity's most critical decade",
    description: 'Artificial General Intelligence is moving from research to reality. Understand the race, the risks, and the strategic decisions that will shape economies, security, and our collective future.',
    primaryCta: {
      text: 'Apply now',
      url: 'https://example.com/apply',
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: '/courses/agi-strategy/1',
    },
    imageSrc: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
    imageAlt: 'AI visualization',
  },
};

// Dark theme variant with custom colors
export const DarkTheme: Story = {
  args: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'The Future of AI',
    description: "Get informed about AI's trajectory and society's biggest choices in just 2 hours. No technical background needed.",
    primaryCta: {
      text: 'Start the free course',
      url: '/courses/future-of-ai/1/1',
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: '/courses/future-of-ai/1/1',
    },
    imageSrc: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop',
    imageAlt: 'Future of AI visualization',
    gradient: 'linear-gradient(135deg, #0a284c 0%, #1a3a5c 100%)',
    accentColor: '#91cfff',
  },
};
