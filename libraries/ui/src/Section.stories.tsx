import type { Meta, StoryObj } from '@storybook/react';
import { Section } from './Section';

const meta = {
  title: 'ui/Section',
  component: Section,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof Section>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Current heading',
    subtitle: 'Text starts with a more blocky letter',
  },
};

export const WithCustomHeadingLevels: Story = {
  args: {
    title: 'Current heading',
    titleLevel: 'h3',
    subtitle: 'Text starts with a more blocky letter',
    subtitleLevel: 'h3',
  },
};
