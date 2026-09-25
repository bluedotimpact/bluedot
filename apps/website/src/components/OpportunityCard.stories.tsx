import type { Meta, StoryObj } from '@storybook/react';
import { P } from '@bluedot/ui';
import OpportunityCard from './OpportunityCard';

const meta: Meta<typeof OpportunityCard> = {
  title: 'Website/OpportunityCard',
  component: OpportunityCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="max-w-lg"><Story /></div>],
  args: {
    title: 'Rapid Grants',
    description: 'Funding for time and resources to explore an idea, do research or build something in AI safety or biosecurity.',
    href: '/grants/rapid',
    tone: 'funding',
    ctaLabel: 'Explore grant',
  },
  argTypes: {
    tone: { control: 'select', options: ['funding', 'careerTransition', 'programs', 'securityBootcamp'] },
    compact: { control: 'boolean' },
    external: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Grant: Story = {
  args: {
    details: (
      <div>
        <P className="text-size-lg font-medium text-white">Up to $20k</P>
        <P className="mt-1 text-size-xs text-white/85">About 15 minutes to apply</P>
        <P className="mt-3 text-size-xs text-white/75">$105k awarded across 104 grants</P>
      </div>
    ),
  },
};

export const Program: Story = {
  args: {
    title: 'AI Security Bootcamp',
    description: 'An intensive, in-person program for technical talent building practical skills for AI security work.',
    href: 'https://aisb.dev/',
    tone: 'securityBootcamp',
    ctaLabel: 'Visit program website',
    external: true,
  },
};

export const Homepage: Story = {
  args: { compact: true, headingLevel: 4, ctaLabel: undefined },
};

export const Mobile: Story = {
  ...Grant,
  parameters: { viewport: { defaultViewport: 'mobile1' } },
};
