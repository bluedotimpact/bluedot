import type { Meta, StoryObj } from '@storybook/react';
import TheWeekSection from './TheWeekSection';

const meta = {
  title: 'website/IncubatorWeek/TheWeekSection',
  component: TheWeekSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Day-by-day schedule for Incubator Week, from Monday threat models through Friday pitches.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TheWeekSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
