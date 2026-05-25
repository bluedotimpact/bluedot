import type { Meta, StoryObj } from '@storybook/react';
import HowItWorksSection from './HowItWorksSection';

const meta = {
  title: 'website/Advising/HowItWorksSection',
  component: HowItWorksSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Three-step "how it works" walkthrough for the 1-1 advising application flow.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof HowItWorksSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
