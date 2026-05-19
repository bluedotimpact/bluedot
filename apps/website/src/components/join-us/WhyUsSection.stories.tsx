import type { Meta, StoryObj } from '@storybook/react';
import WhyUsSection from './WhyUsSection';

const meta = {
  title: 'website/JoinUs/WhyUsSection',
  component: WhyUsSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '"Why us" pitch on /join-us. Static copy block — edit `WhyUsSection.tsx` to change.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WhyUsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
