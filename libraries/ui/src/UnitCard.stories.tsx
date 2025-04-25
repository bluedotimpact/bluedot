import type { Meta, StoryObj } from '@storybook/react';

import { UnitCard } from './UnitCard';

const meta = {
  title: 'ui/UnitCard',
  component: UnitCard,
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
  },
} satisfies Meta<typeof UnitCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: 'Title',
    description: 'Description',
    url: 'https://bluedot.org/courses/what-the-fish/1',
    unitNumber: '1',
    duration: 10,
  },
};
