import type { Meta, StoryObj } from '@storybook/react';
import MergedLadder from './MergedLadder';

const meta = {
  title: 'Website/Homepage/MergedLadder',
  component: MergedLadder,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Three-rung homepage funnel: orient via Future of AI, specialise via online courses, then get funding or join an in-person program.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MergedLadder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
