import type { Meta, StoryObj } from '@storybook/react';
import TheWeekSection from './TheWeekSection';

const meta = {
  title: 'website/FieldbuilderWeek/TheWeekSection',
  component: TheWeekSection,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Day-by-day schedule for Fieldbuilder Week, framed against Incubator Week.',
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
