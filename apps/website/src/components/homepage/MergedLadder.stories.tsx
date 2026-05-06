import type { Meta, StoryObj } from '@storybook/react';
import MergedLadder from './MergedLadder';

const meta = {
  title: 'Website/Homepage/MergedLadder',
  component: MergedLadder,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Three-rung homepage funnel: Step 1 (orient via Future of AI), Step 2 (specialise via cohort courses), Step 3 (contribute via grants). Replaces the legacy CourseSection + GrantsSection.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MergedLadder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
