import type { Meta, StoryObj } from '@storybook/react';
import PathwaysListSection, { type PathwaysListItem } from './PathwaysListSection';

const meta = {
  title: 'website/CourseLander/PathwaysListSection',
  component: PathwaysListSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A simple list-style section that surfaces post-course pathways as `PageListRow` entries. Lighter visual weight than the icon-driven `PathwaysSection`.',
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
    intro: {
      description: 'Optional intro paragraph rendered below the heading',
      control: 'text',
    },
    items: {
      description: 'Array of pathway list items to render',
      control: 'object',
    },
  },
} satisfies Meta<typeof PathwaysListSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleItems: PathwaysListItem[] = [
  {
    title: 'Technical AI Safety',
    summary: 'Interpretability, evals, alignment research. For people ready to work on the technical problems.',
    href: '/courses/technical-ai-safety',
    ctaLabel: 'Explore the course',
  },
  {
    title: 'AI Governance',
    summary: 'Policy, institutions, international coordination. For people shaping how these systems get governed.',
    href: '/courses/ai-governance',
    ctaLabel: 'Explore the course',
  },
  {
    title: 'Biosecurity',
    summary: 'Pandemic preparedness, early warning systems, policy. For people building defences against bio risks.',
    href: '/courses/biosecurity',
    ctaLabel: 'Explore the course',
  },
  {
    title: 'Rapid Grants',
    summary: 'Small, fast funding for concrete AI safety work. Five-minute application, decisions in days, money upfront by default.',
    href: '/programs/rapid-grants',
    ctaLabel: 'Explore program',
  },
  {
    title: 'Career Transition Grants',
    summary: 'Funding to enable you to work full-time on impactful AI safety work. Propose your plan and we\'ll back you.',
    href: '/programs/career-transition-grant',
    ctaLabel: 'Explore program',
  },
];

export const Default: Story = {
  args: {
    title: 'What happens after',
    intro: 'This course is where you get oriented. What comes next depends on you.',
    items: sampleItems,
  },
};

export const NoIntro: Story = {
  args: {
    title: 'Where alumni go',
    items: sampleItems.slice(0, 4),
  },
};
