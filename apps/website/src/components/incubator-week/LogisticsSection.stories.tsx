import type { Meta, StoryObj } from '@storybook/react';
import LogisticsSection from './LogisticsSection';

const meta = {
  title: 'website/IncubatorWeek/LogisticsSection',
  component: LogisticsSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Logistics breakdown for Incubator Week (location, focus areas, schedule).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof LogisticsSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
