import type { Meta, StoryObj } from '@storybook/react';
import WhoIsThisForTextSection from './WhoIsThisForTextSection';

const meta = {
  title: 'website/CourseLander/WhoIsThisForTextSection',
  component: WhoIsThisForTextSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'An editorial, prose-led variant of the "Who this course is for" section. Supports a list of paragraphs and/or a list of heading + body items, without icons or persona cards.',
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
} satisfies Meta<typeof WhoIsThisForTextSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Who this course is for',
    paragraphs: [
      'You\'ve read some essays, watched the talks, and you don\'t think the people building AGI have a serious plan for making it go well. You want to change that.',
      'The course is an in-depth introduction to what\'s going on with AI development, what the good and bad outcomes could be, and what could be done to steer AI towards better futures.',
      'It\'s built for three groups: 1) domain experts in policy, security, operations, or engineering looking to redirect their skills; 2) people heading into technical safety or governance roles who want the strategic picture first; and 3) newcomers who are serious about making big moves and having a huge impact.',
      'Not sure you fit? Apply anyway. Recent cohorts have also included teachers, lawyers, engineers, and community organisers.',
    ],
  },
};

export const WithItems: Story = {
  args: {
    id: 'personas',
    title: 'Who this course is for',
    items: [
      {
        heading: 'Technical people considering governance',
        body: 'You understand how these systems work — you\'ve built, shipped, or founded. You\'re considering whether to point those skills at policy. Engineers, PMs, and founders have made this move and now sit at AISI, NIST, GovAI, and lab policy teams.',
      },
      {
        heading: 'Serious early-career people',
        body: 'You\'ve engaged seriously with AI — through our AGI Strategy course, a university group, or your own reading — and you\'re weighing fellowships, grad school, law school, or roles you haven\'t fully mapped. Alumni from this track have gone to Horizon, GovAI, AISI, and lab policy teams.',
      },
      {
        heading: 'Professionals with institutional knowledge',
        body: 'You have a career — policy, national security, economics, law, diplomacy, intelligence, journalism, finance — and you can see AI is about to reshape it. Your goal isn\'t to switch fields. It\'s to become the person your beat, your agency, your country turns to on the risks and opportunities of AGI.',
      },
    ],
  },
};
