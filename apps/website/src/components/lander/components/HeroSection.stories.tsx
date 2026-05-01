import type { Meta, StoryObj } from '@storybook/react';
import HeroSection from './HeroSection';
import { AGI_STRATEGY_COLORS } from '../course-content/AgiStrategyContent';
import { BIOSECURITY_COLORS } from '../course-content/BioSecurityContent';
import { FOAI_COLORS } from '../course-content/FutureOfAiContent';
import { AI_GOVERNANCE_COLORS } from '../course-content/AiGovernanceContent';
import { TAS_COLORS } from '../course-content/TechnicalAiSafetyContent';

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
    title: 'AGI Strategy – Learn how to navigate humanity\'s most critical decade',
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
    description: 'An introduction to what AI can do today, where it\'s going over the next decade, and how you can start contributing to a better future.',
    primaryCta: {
      text: 'Start the free course',
      url: '/courses/future-of-ai/1/1',
    },
    imageSrc: '/images/lander/foai/hero-graphic.png',
    imageAlt: 'Future of AI visualization',
    imageAspectRatio: '1408/1112',
    gradient: FOAI_COLORS.gradient,
    accentColor: FOAI_COLORS.accent,
  },
};

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
    gradient: BIOSECURITY_COLORS.gradient,
    accentColor: BIOSECURITY_COLORS.accent,
    categoryLabelColor: BIOSECURITY_COLORS.categoryLabel,
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
    gradient: AGI_STRATEGY_COLORS.gradient,
    accentColor: AGI_STRATEGY_COLORS.accent,
  },
};

export const TechnicalAISafety: Story = {
  args: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'Technical AI Safety',
    description: 'Understand current safety techniques. Map the gaps. Identify where you can contribute. All in 30 hours.',
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
    gradient: TAS_COLORS.gradient,
    accentColor: TAS_COLORS.accent,
    imageAspectRatio: '1408/1122',
  },
};

export const AiGovernance: Story = {
  args: {
    categoryLabel: 'COHORT-BASED COURSE',
    title: 'AI Governance',
    description: 'Learn about the policy landscape, regulatory tools, and institutional reforms needed to navigate the transition to transformative AI.',
    primaryCta: {
      text: 'Apply now',
      url: 'https://web.miniextensions.com/BSUqN3WHmeL9MbzAj2P6',
    },
    secondaryCta: {
      text: 'Browse curriculum',
      url: '/courses/ai-governance/1/1',
    },
    imageSrc: '/images/lander/ai-governance/hero-graphic.png',
    imageAlt: 'AI Governance visualization',
    imageAspectRatio: '1408/1122',
    gradient: AI_GOVERNANCE_COLORS.gradient,
    accentColor: AI_GOVERNANCE_COLORS.accent,
  },
};
