import type { Meta, StoryObj } from '@storybook/react';
import {
  PiBriefcase, PiCompass, PiFlask,
} from 'react-icons/pi';
import WhoIsThisForSection from './WhoIsThisForSection';

const meta = {
  title: 'website/CourseLander/WhoIsThisForSection',
  component: WhoIsThisForSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A section displaying target audience cards with optional bottom CTA, used on course landing pages.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      description: 'Section heading text',
      control: 'text',
    },
    targetAudiences: {
      description: 'Array of target audience cards to display',
      control: 'object',
    },
    bottomCta: {
      description: 'Optional bottom call-to-action section',
      control: 'object',
    },
  },
} satisfies Meta<typeof WhoIsThisForSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiBriefcase,
        boldText: 'For entrepreneurs and operators',
        description: 'who want to build solutions that protect humanity.',
      },
      {
        icon: PiCompass,
        boldText: 'For leaders',
        description: "who want to steer AI's trajectory towards beneficial outcomes for humanity.",
      },
      {
        icon: PiFlask,
        boldText: 'For researchers',
        description: 'who want to take big bets on the most impactful research ideas.',
      },
    ],
    bottomCta: {
      boldText: "Don't fit these perfectly? Apply anyway.",
      text: 'Some of our most impactful participants have included teachers, policymakers, engineers, and community leaders. We bet on drive and ambition, not CVs.',
      buttonText: 'Apply now',
      buttonUrl: 'https://example.com/apply',
    },
  },
};

export const WithoutBottomCta: Story = {
  args: {
    title: 'Who this course is for',
    targetAudiences: [
      {
        icon: PiBriefcase,
        boldText: 'For entrepreneurs and operators',
        description: 'who want to build solutions that protect humanity.',
      },
      {
        icon: PiCompass,
        boldText: 'For leaders',
        description: "who want to steer AI's trajectory towards beneficial outcomes for humanity.",
      },
      {
        icon: PiFlask,
        boldText: 'For researchers',
        description: 'who want to take big bets on the most impactful research ideas.',
      },
    ],
  },
};
