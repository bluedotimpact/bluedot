import type { Meta, StoryObj } from '@storybook/react';
import TrackRecordSection from './TrackRecordSection';

const meta = {
  title: 'website/IncubatorWeek/TrackRecordSection',
  component: TrackRecordSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Track record section listing past Incubator Week cohort outcomes and alumni companies.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof TrackRecordSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
