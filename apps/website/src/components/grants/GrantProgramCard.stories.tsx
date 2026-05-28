import type { Meta, StoryObj } from '@storybook/react';
import GrantProgramCard from './GrantProgramCard';

const meta = {
  title: 'website/Grants/GrantProgramCard',
  component: GrantProgramCard,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'A program card used on grant programme landing pages. Renders an objective + scope + optional example grant block, status pill, and primary/secondary CTAs. Supports `primary` and `secondary` emphasis sizes.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GrantProgramCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    slug: 'rapid-grants',
    title: 'Rapid Grants',
    goal: 'Fund talented people in the BlueDot community to do excellent work on AI safety — research, events, community building, and more.',
    scope: 'Grants up to $10,000 for project costs, events, travel, community building, and other costs that remove barriers. Fast decisions, lightweight process.',
    href: '/programs/rapid-grants',
    applyUrl: 'https://example.com/apply/rapid-grants',
    status: 'Active',
    emphasis: 'primary',
    example: {
      title: 'AI Safety Workshop Series',
      summary: 'Six-session reading group on mechanistic interpretability for early-career researchers.',
      meta: '$4,500 · Mar 2026',
      url: 'https://example.com/workshop',
    },
  },
};

export const SecondaryEmphasis: Story = {
  args: {
    slug: 'advising',
    title: '1-1 advising',
    goal: 'Help BlueDot community members figure out how to contribute their skills to AI safety.',
    scope: 'A 30-minute call with the BlueDot team. Leave with concrete next steps.',
    href: '/programs/advising',
    applyUrl: 'https://example.com/apply/advising',
    status: 'Active',
    emphasis: 'secondary',
  },
};

export const OnHiatus: Story = {
  args: {
    slug: 'incubator-week',
    title: 'Incubator Week',
    goal: 'Back graduates launching AI safety companies, with equity-free funding and an intensive week in San Francisco.',
    scope: 'Cohort 5 runs in San Francisco, July 20–25. Apply by July 10 for a five-day sprint from idea to funded.',
    scopeLabel: 'Format',
    href: '/programs/incubator-week',
    status: 'On hiatus',
    emphasis: 'secondary',
  },
};
