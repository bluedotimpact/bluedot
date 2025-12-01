import type { Meta, StoryObj } from '@storybook/react';
import StorySection from './StorySection';

const meta = {
  title: 'Website/Homepage/StorySection',
  component: StorySection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'The "Who is BlueDot?" section of the homepage featuring a team photo and description of the organization with a hiring CTA.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof StorySection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
