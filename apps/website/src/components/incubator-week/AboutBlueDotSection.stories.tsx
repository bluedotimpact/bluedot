import type { Meta, StoryObj } from '@storybook/react';
import AboutBlueDotSection from './AboutBlueDotSection';

const meta = {
  title: 'website/IncubatorWeek/AboutBlueDotSection',
  component: AboutBlueDotSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Closing section on the Incubator Week / Fieldbuilder Week landing pages that introduces BlueDot Impact and renders the primary application CTA.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AboutBlueDotSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    applicationUrl: 'https://example.com/apply',
    applicationDeadline: 'August 7',
    contactEmail: 'joshua@bluedot.org',
  },
};

export const NoApplicationUrl: Story = {
  args: {
    applicationUrl: undefined,
  },
};
