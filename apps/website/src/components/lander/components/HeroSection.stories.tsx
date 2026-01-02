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

export const FutureOfAI: Story = {
  args: {
    categoryLabel: 'SELF-PACED COURSE',
    title: 'The Future of AI',
    description: "An introduction to what AI can do today, where it's going over the next decade, and how you can start contributing to a better future.",
    primaryCta: {
      text: 'Start the free course',
      url: '/courses/future-of-ai/1/1',
    },
    imageSrc: '/images/lander/foai/hero-graphic.png',
    imageAlt: 'Future of AI visualization',
    imageAspectRatio: '1408/1112',
    gradient: 'linear-gradient(to right, rgba(30, 30, 20, 0.6) 0%, rgba(30, 30, 20, 0.4) 25%, rgba(30, 30, 20, 0.2) 45%, transparent 60%), radial-gradient(ellipse 70% 60% at 85% 20%, rgba(155, 180, 115, 0.12) 0%, transparent 60%), radial-gradient(ellipse 200% 180% at 105% -5%, rgba(150, 207, 156, 0.35) 0%, rgba(163, 179, 110, 0.35) 28.6%, rgba(176, 152, 64, 0.35) 57.2%, rgba(147, 120, 64, 0.35) 67.9%, rgba(118, 88, 64, 0.35) 78.6%, rgba(89, 56, 63, 0.35) 89.3%, rgba(60, 24, 63, 0.35) 100%), #29281D',
    accentColor: '#E6DBA6',
  },
};

// Biosecurity course with green gradient (light source from bottom-right)
export const Biosecurity: Story = {
  args: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'Biosecurity',
    description: 'Start building towards a pandemic-proof world: Understand current efforts to prevent, detect and respond to pandemic threats. Identify where you can contribute. Get funded to start building. All in 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: 'https://example.com/apply',
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: '/courses/biosecurity/1/1',
    },
    imageSrc: '/images/lander/biosecurity/hero-graphic.png',
    imageAlt: 'Biosecurity visualization',
    imageAspectRatio: '1408/1122',
    gradient: 'linear-gradient(135deg, #012A07 10%, rgba(1, 42, 7, 0.00) 90%), radial-gradient(110.09% 127.37% at 112.15% 117.08%, rgba(220, 238, 171, 0.45) 0%, rgba(86, 140, 94, 0.45) 50%, rgba(1, 42, 7, 0.45) 100%), radial-gradient(97.29% 122.23% at 85.59% 126.89%, rgba(222, 149, 47, 0.35) 0%, rgba(157, 205, 98, 0.35) 52.4%, rgba(28, 175, 141, 0.35) 100%), #012A07',
    accentColor: '#ABEEB5',
    categoryLabelColor: '#81DBAF',
  },
};

export const AgiStrategy: Story = {
  args: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'AGI Strategy',
    description: 'Start building the defences that protect humanity: Envision a good future. Map the threats from AI. Design effective interventions. Get funded to start shipping. All in 30 hours.',
    primaryCta: {
      text: 'Apply now',
      url: 'https://example.com/apply',
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: '/courses/agi-strategy/1/1',
    },
    imageSrc: '/images/lander/agi-strategy/hero-graphic.png',
    imageAlt: 'AGI Strategy visualization',
    imageAspectRatio: '1408/1122',
    gradient: 'linear-gradient(to right, rgba(10, 8, 36, 0.9) 0%, rgba(10, 8, 36, 0.4) 5%, rgba(10, 8, 36, 0.15) 15%, rgba(10, 8, 36, 0.05) 30%, transparent 45%), radial-gradient(115% 175% at 95% 135%, rgba(255, 194, 195, 0.65) 0%, rgba(255, 194, 195, 0.50) 25%, rgba(53, 42, 106, 0.65) 60%, rgba(10, 8, 36, 0.60) 100%), #181D3F',
    accentColor: '#BCA9FF',
  },
};

// Technical AI Safety gradient hero with constrained image layout
export const TechnicalAISafety: Story = {
  args: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'Technical AI Safety',
    description: 'Make a technical contribution to AI safety in 30 hours. Work with an AI safety expert to contribute to AI safety research or engineering.',
    primaryCta: {
      text: 'Apply now',
      url: 'https://example.com/apply',
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: '/courses/technical-ai-safety/1/1',
    },
    imageSrc: '/images/lander/technical-ai-safety/hero-graphic.png',
    imageAlt: 'Technical AI Safety visualization',
    gradient: 'linear-gradient(to right, rgba(20, 8, 25, 0.6) 0%, rgba(20, 8, 25, 0.4) 20%, rgba(20, 8, 25, 0.2) 40%, transparent 55%), radial-gradient(130% 160% at 100% 108.81%, rgba(255, 202, 171, 0.40) 0%, rgba(126, 85, 144, 0.40) 52.4%, rgba(46, 16, 54, 0.40) 100%), #2E1036',
    accentColor: '#E0A5F9',
    imageAspectRatio: '1408/1122',
  },
};
