import type { Meta, StoryObj } from '@storybook/react';
import FieldBuildingSection, { type FieldBuildingRole } from './FieldBuildingSection';

const meta = {
  title: 'website/CourseLander/FieldBuildingSection',
  component: FieldBuildingSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A section showcasing optional ways to contribute to building the field — typically faculty / facilitator / fellow-researcher roles — as a list of role cards with descriptions and apply links.',
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
      description: 'Intro text shown below the heading',
      control: 'text',
    },
    roles: {
      description: 'Array of role entries to render',
      control: 'object',
    },
    headingVariant: {
      description: 'Heading style: section-style `default` or smaller `compact`',
      control: 'inline-radio',
      options: ['default', 'compact'],
    },
  },
} satisfies Meta<typeof FieldBuildingSection>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleRoles: FieldBuildingRole[] = [
  {
    title: 'Adjunct Experts and Facilitators',
    description: 'Work with a cohort for about 5 hours per week: lead discussions, bring current AI governance judgment, and help participants find their next step.',
    linkUrl: '/facilitate',
    linkText: 'Apply',
  },
  {
    title: 'Fellow-Researchers',
    description: 'Teach while continuing governance research or field-building work, typically 20-30 hours per week.',
    linkUrl: '/facilitate',
    linkText: 'Apply',
  },
];

export const Default: Story = {
  args: {
    title: 'Help build the field',
    intro: 'We also hire Adjunct Experts and Facilitators (~5h/week) and Fellow-Researchers (20-30h/week) to teach.',
    roles: sampleRoles,
  },
};

export const Compact: Story = {
  args: {
    title: 'Help build the field',
    intro: 'We also hire Adjunct Experts and Facilitators (~5h/week) and Fellow-Researchers (20-30h/week) to teach.',
    headingVariant: 'compact',
    roles: sampleRoles,
  },
};
