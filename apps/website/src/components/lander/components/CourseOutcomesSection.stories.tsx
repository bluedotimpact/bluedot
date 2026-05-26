import type { Meta, StoryObj } from '@storybook/react';
import {
  PiBank,
  PiBookOpen,
  PiHandshake,
  PiLightbulb,
  PiMapTrifold,
  PiPath,
} from 'react-icons/pi';
import CourseOutcomesSection, { type CourseOutcome } from './CourseOutcomesSection';
import { AI_GOVERNANCE_COLORS } from '../course-content/AiGovernanceContent';
import { AGI_STRATEGY_COLORS } from '../course-content/AgiStrategyContent';
import { TAS_COLORS } from '../course-content/TechnicalAiSafetyContent';

const meta = {
  title: 'website/CourseLander/CourseOutcomesSection',
  component: CourseOutcomesSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A section laying out concrete unit-by-unit course outcomes as icon + title + description cards, with optional per-card links and a section-level CTA.',
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
    outcomes: {
      description: 'Array of outcome cards to render',
      control: 'object',
    },
    accentColor: {
      description: 'Accent color used for icon tinting',
      control: 'color',
    },
    headingVariant: {
      description: 'Heading style: section-style `default` or smaller `compact`',
      control: 'inline-radio',
      options: ['default', 'compact'],
    },
    cta: {
      description: 'Optional CTA shown below the cards',
      control: 'object',
    },
  },
} satisfies Meta<typeof CourseOutcomesSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const aiGovernanceOutcomes: CourseOutcome[] = [
  {
    icon: PiBookOpen,
    title: 'Unit 1: Read models like a policymaker',
    description: 'Read a full system card alongside METR and Epoch evaluations; produce policy briefings tailored to a specific decision-maker.',
    linkUrl: '/courses/ai-governance/1/1',
    linkText: 'View Unit 1',
  },
  {
    icon: PiMapTrifold,
    title: 'Unit 2: Map power',
    description: 'Map who has power over frontier AI — labs, governments, international bodies — and where the gaps are, including how other actors approach AI risk.',
    linkUrl: '/courses/ai-governance/2/1',
    linkText: 'View Unit 2',
  },
  {
    icon: PiHandshake,
    title: 'Unit 3: Stress-test proposals',
    description: 'Survey compute governance, safety standards, liability, and international coordination. Argue for and against proposals you didn\'t choose.',
    linkUrl: '/courses/ai-governance/3/1',
    linkText: 'View Unit 3',
  },
  {
    icon: PiBank,
    title: 'Unit 4: Govern under pressure',
    description: 'Examine competitive dynamics between labs and states, power concentration, and governance as capabilities approach and exceed human-level.',
    linkUrl: '/courses/ai-governance/4/1',
    linkText: 'View Unit 4',
  },
  {
    icon: PiLightbulb,
    title: 'Unit 5: Take a side',
    description: 'Pick a live debate — open-weight models, whether frontier development should be slowed, and more. Read across the spectrum, then defend a position in writing.',
    linkUrl: '/courses/ai-governance/5/1',
    linkText: 'View Unit 5',
  },
  {
    icon: PiPath,
    title: 'Unit 6: Make your roadmap',
    description: 'Audit your skills, network, and comparative advantage. Produce a 6-month roadmap, with the expectation you\'ll act on it.',
    linkUrl: '/courses/ai-governance/6/1',
    linkText: 'View Unit 6',
  },
];

export const Default: Story = {
  args: {
    title: 'What you\'ll actually do',
    outcomes: aiGovernanceOutcomes,
    accentColor: AI_GOVERNANCE_COLORS.iconBackground,
    headingVariant: 'compact',
  },
};

export const WithCta: Story = {
  args: {
    title: 'What you\'ll get',
    outcomes: aiGovernanceOutcomes,
    accentColor: AGI_STRATEGY_COLORS.iconBackground,
    cta: {
      text: 'Apply now',
      url: 'https://example.com/apply',
    },
  },
};

export const TechnicalAiSafetyColors: Story = {
  args: {
    title: 'What you\'ll actually do',
    outcomes: aiGovernanceOutcomes,
    accentColor: TAS_COLORS.iconBackground,
    headingVariant: 'compact',
  },
};
