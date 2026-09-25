import type { Meta, StoryObj } from '@storybook/react';
import GrantCta from './GrantCta';
import GrantFaqSection from './GrantFaqSection';

const meta = {
  title: 'website/Grants/Sections',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Reusable section components rendered on the grant type pages under /grants. Each takes a grant type slug. FAQ items are sourced from `GRANT_TYPE_FAQS` in `grantTypeFaqs.tsx`.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

export const Cta: StoryObj = {
  name: 'GrantCta',
  render: () => <GrantCta grantType="rapid" />,
};

export const FaqRapidGrants: StoryObj = {
  name: 'GrantFaqSection — Rapid Grants',
  render: () => <GrantFaqSection grantType="rapid" />,
};

export const FaqCareerTransition: StoryObj = {
  name: 'GrantFaqSection — Career Transition',
  render: () => <GrantFaqSection grantType="career-transition" />,
};
