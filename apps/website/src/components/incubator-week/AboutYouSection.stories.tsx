import type { Meta, StoryObj } from '@storybook/react';
import AboutYouSection from './AboutYouSection';

const meta = {
  title: 'website/IncubatorWeek/AboutYouSection',
  component: AboutYouSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Section describing the ideal Incubator Week applicant, with an inline referral prompt.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof AboutYouSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
