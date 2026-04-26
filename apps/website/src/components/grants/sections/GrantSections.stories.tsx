import type { Meta, StoryObj } from '@storybook/react';
import GrantCta from './GrantCta';
import GrantFaqSection from './GrantFaqSection';
import GrantStatsStrip from './GrantStatsStrip';

const meta = {
  title: 'website/Grants/Sections',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Reusable section components rendered on the /grants programme pages. Each takes a program slug and (for stats/faq) the displayed content. CTAs and FAQ items are sourced from `GRANT_PROGRAM_SECTIONS` in `grantPrograms.ts`.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

const sampleStats = [
  { label: 'Typical grants', value: 'Up to $10k' },
  { label: 'Decision time', value: '< 2 weeks' },
  { label: 'Funded so far', value: '$1.4M+' },
  { label: 'Active programmes', value: '4' },
];

export const Cta: StoryObj = {
  name: 'GrantCta',
  render: () => <GrantCta program="rapid-grants" />,
};

export const StatsStrip: StoryObj = {
  name: 'GrantStatsStrip — roomy',
  render: () => <GrantStatsStrip program="rapid-grants" stats={sampleStats} />,
};

export const StatsStripCompact: StoryObj = {
  name: 'GrantStatsStrip — compact',
  render: () => <GrantStatsStrip program="rapid-grants" stats={sampleStats} compact />,
};

export const FaqRapidGrants: StoryObj = {
  name: 'GrantFaqSection — Rapid Grants',
  render: () => <GrantFaqSection program="rapid-grants" />,
};

export const FaqCareerTransition: StoryObj = {
  name: 'GrantFaqSection — Career Transition',
  render: () => <GrantFaqSection program="career-transition-grant" />,
};
