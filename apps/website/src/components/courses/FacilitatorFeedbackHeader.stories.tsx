import type { Meta, StoryObj } from '@storybook/react';
import FacilitatorFeedbackHeader from './FacilitatorFeedbackHeader';

const meta = {
  title: 'Courses/FacilitatorFeedbackHeader',
  component: FacilitatorFeedbackHeader,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Header shown on the facilitator feedback flow. Includes the BlueDot logo, a section label, and an optional round name.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof FacilitatorFeedbackHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const WithRoundName: Story = {
  args: {
    roundName: 'AI Safety Fundamentals · Spring 2026',
  },
};
