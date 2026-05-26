import type { Meta, StoryObj } from '@storybook/react';
import CourseBenefitsTextSection from './CourseBenefitsTextSection';

const meta = {
  title: 'website/CourseLander/CourseBenefitsTextSection',
  component: CourseBenefitsTextSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'An editorial, prose-led variant of the course benefits section. Renders an optional list of paragraphs and/or a list of heading + body items, without icons or cards.',
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
    paragraphs: {
      description: 'Optional array of paragraph nodes',
      control: 'object',
    },
    items: {
      description: 'Optional array of heading + body items',
      control: 'object',
    },
  },
} satisfies Meta<typeof CourseBenefitsTextSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'How this course will benefit you',
    items: [
      {
        heading: 'A launchpad for your AI safety career',
        body: 'You\'ll leave this course with an opinion on which threats matter, early takes on how we could solve these problems, and concrete next steps you can take.',
      },
      {
        heading: 'A clear way to think about the future of AI',
        body: 'You\'ll analyse the incentives facing AI companies. You\'ll develop "kill chains" to analyse the threats. And you\'ll apply defense in depth to evaluate and prioritise interventions. You\'ll know enough to hold your own in rooms with experts.',
      },
      {
        heading: 'A community of builders',
        body: 'BlueDot has 7,000+ alumni, with many now working at Anthropic, DeepMind, UK AISI, and dozens of organisations working on a safe transition to advanced AI. You\'ll meet people in the field who can open doors for you and pressure-test your thinking.',
      },
    ],
  },
};

export const WithParagraphs: Story = {
  args: {
    id: 'support',
    title: 'How BlueDot supports you beyond the course',
    paragraphs: [
      'FAIGC is one course in a wider BlueDot pipeline. During the course, we learn enough about participants to point them toward what makes sense next. Outside BlueDot, that often means introductions to hiring managers at AI safety organisations or fellowship leads.',
      'The AGI Strategy Course is the upstream prerequisite; jurisdiction- and domain-specific courses are in development. About 8,000 alumni are in our Slack — job openings and policy debates come through daily.',
    ],
  },
};
