import type { Meta, StoryObj } from '@storybook/react';
import HeroSection from './HeroSection';

const meta = {
  title: 'website/Lander/HeroSection',
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
    metadata: {
      description: 'Course metadata displayed as badges',
      control: 'object',
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
    visualComponent: {
      description: 'Visual component (typically an image) displayed on the right/top',
      control: false,
    },
  },
} satisfies Meta<typeof HeroSection>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default story with all props
export const Default: Story = {
  args: {
    metadata: {
      duration: '30 hours',
      certification: 'Verified certificate',
      level: 'Beginner-friendly',
    },
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
  },
};

// With image visual component
export const WithImage: Story = {
  args: {
    ...Default.args,
    visualComponent: (
      <img
        src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&h=600&fit=crop"
        alt="AI visualization"
        className="size-full object-cover"
      />
    ),
  },
};

// With gradient background as visual
export const WithGradientVisual: Story = {
  args: {
    ...Default.args,
    visualComponent: (
      <div className="size-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-80" />
    ),
  },
};

// Different content example - AI Alignment course
export const AIAlignmentCourse: Story = {
  args: {
    metadata: {
      duration: '40 hours',
      certification: 'Professional certificate',
      level: 'Intermediate',
    },
    title: 'AI Alignment – Building safe and beneficial AI systems',
    description: 'Learn the technical foundations of AI alignment, from reward modeling to interpretability. Join researchers and engineers working on the frontier of AI safety.',
    primaryCta: {
      text: 'Start learning',
      url: '/courses/ai-alignment/apply',
    },
    secondaryCta: {
      text: 'View syllabus',
      url: '/courses/ai-alignment/syllabus',
    },
    visualComponent: (
      <div className="size-full bg-gradient-to-tr from-green-400 to-blue-500 opacity-90" />
    ),
  },
};

// Shorter content variation
export const ShortContent: Story = {
  args: {
    metadata: {
      duration: '10 hours',
      certification: 'Completion badge',
      level: 'All levels',
    },
    title: 'Quick Start to AI Safety',
    description: 'A concise introduction to AI safety concepts and practices.',
    primaryCta: {
      text: 'Enroll',
      url: '/enroll',
    },
    secondaryCta: {
      text: 'Learn more',
      url: '/info',
    },
  },
};

// Long content variation
export const LongContent: Story = {
  args: {
    metadata: {
      duration: '100+ hours',
      certification: 'Advanced certification',
      level: 'Expert',
    },
    title: 'Advanced AI Governance and Policy – Comprehensive Training for Policy Makers and Technical Leaders',
    description: 'This comprehensive program covers the full spectrum of AI governance, from technical standards and safety requirements to international cooperation frameworks. You\'ll learn from leading experts in AI policy, engage with real-world case studies, and develop practical skills for governing transformative AI systems. The course includes modules on risk assessment, regulatory frameworks, stakeholder engagement, and crisis management.',
    primaryCta: {
      text: 'Apply for admission',
      url: '/apply',
    },
    secondaryCta: {
      text: 'Download prospectus',
      url: '/prospectus',
    },
    visualComponent: (
      <img
        src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=600&fit=crop"
        alt="Technology visualization"
        className="size-full object-cover"
      />
    ),
  },
};

// Mobile viewport story
export const Mobile: Story = {
  args: {
    ...Default.args,
    visualComponent: (
      <img
        src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop"
        alt="AI visualization"
        className="size-full object-cover"
      />
    ),
  },
  parameters: {
    viewport: {
      defaultViewport: 'iphone12',
    },
  },
};

// Tablet viewport story
export const Tablet: Story = {
  args: {
    ...WithImage.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'ipad',
    },
  },
};

// Desktop viewport story
export const Desktop: Story = {
  args: {
    ...WithImage.args,
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
  },
};

// Without visual component
export const NoVisual: Story = {
  args: {
    ...Default.args,
    visualComponent: undefined,
  },
};

// Custom styled visual component
export const CustomVisual: Story = {
  args: {
    ...Default.args,
    visualComponent: (
      <div className="size-full flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <svg
            className="size-32 mx-auto text-blue-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-4 text-gray-600">AI Strategy Visualization</p>
        </div>
      </div>
    ),
  },
};

// Dark theme variation (if your app supports themes)
export const DarkBackground: Story = {
  args: {
    ...Default.args,
    visualComponent: (
      <div className="size-full bg-gradient-to-br from-gray-900 to-gray-700" />
    ),
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-900">
        <Story />
      </div>
    ),
  ],
};

// Interactive example with hover states visible
export const HoverStates: Story = {
  args: {
    ...Default.args,
  },
  parameters: {
    pseudo: {
      hover: ['[role="link"]'],
    },
  },
};
