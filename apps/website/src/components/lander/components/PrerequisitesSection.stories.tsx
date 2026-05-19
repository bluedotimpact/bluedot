import type { Meta, StoryObj } from '@storybook/react';
import {
  PiBookOpen,
  PiCode,
  PiGraduationCap,
} from 'react-icons/pi';
import PrerequisitesSection, { type Prerequisite } from './PrerequisitesSection';
import { TAS_COLORS } from '../course-content/TechnicalAiSafetyContent';
import { AGI_STRATEGY_COLORS } from '../course-content/AgiStrategyContent';

const meta = {
  title: 'website/CourseLander/PrerequisitesSection',
  component: PrerequisitesSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A three-column grid of prerequisite cards. Each card describes a recommended background or piece of preparation, with optional icon and per-card CTA.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    id: {
      description: 'Optional anchor id for in-page navigation',
      control: 'text',
    },
    title: {
      description: 'Section heading',
      control: 'text',
    },
    prerequisites: {
      description: 'Array of prerequisite cards',
      control: 'object',
    },
    accentColor: {
      description: 'Accent color used for icon tinting',
      control: 'color',
    },
    cta: {
      description: 'Optional CTA shown below the cards',
      control: 'object',
    },
  },
} satisfies Meta<typeof PrerequisitesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const samplePrerequisites: Prerequisite[] = [
  {
    icon: PiBookOpen,
    title: 'AI Foundations',
    description: 'Our free, self-paced 2-hour course covers the basics of how modern LLMs work. Take it first if you have no prior exposure.',
    ctaText: 'Start AI Foundations',
    ctaUrl: 'https://bluedot-impact.notion.site/AI-Foundations-293f8e69035380f29863c4c92c41fac7',
  },
  {
    icon: PiCode,
    title: 'Comfortable with code',
    description: 'You should be comfortable reading and writing Python, and willing to dive into ML research papers. We don\'t expect you to be an ML expert.',
  },
  {
    icon: PiGraduationCap,
    title: 'AGI Strategy (recommended)',
    description: 'Not required, but strongly recommended. The AGI Strategy course gives you the strategic context that this course builds on.',
    ctaText: 'Browse AGI Strategy',
    ctaUrl: '/courses/agi-strategy',
  },
];

export const Default: Story = {
  args: {
    title: 'Prerequisites',
    prerequisites: samplePrerequisites,
    accentColor: TAS_COLORS.iconBackground,
  },
};

export const WithCta: Story = {
  args: {
    title: 'Prerequisites',
    prerequisites: samplePrerequisites,
    accentColor: AGI_STRATEGY_COLORS.iconBackground,
    cta: {
      text: 'Apply now',
      url: 'https://example.com/apply',
    },
  },
};
