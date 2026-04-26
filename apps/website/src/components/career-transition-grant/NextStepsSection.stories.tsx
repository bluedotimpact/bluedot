import type { Meta, StoryObj } from '@storybook/react';
import NextStepsSection from './NextStepsSection';

const meta = {
  title: 'website/CareerTransitionGrant/NextStepsSection',
  component: NextStepsSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Three-step "What happens next" timeline rendered on the /career-transition-grant page. The steps are hard-coded — change copy in `NextStepsSection.tsx`.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof NextStepsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
