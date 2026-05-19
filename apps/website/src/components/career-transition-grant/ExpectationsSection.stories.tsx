import type { Meta, StoryObj } from '@storybook/react';
import ExpectationsSection from './ExpectationsSection';

const meta = {
  title: 'website/CareerTransitionGrant/ExpectationsSection',
  component: ExpectationsSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A "What we expect from you" list on /career-transition-grant. Items are hard-coded — change copy in `ExpectationsSection.tsx`.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ExpectationsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
