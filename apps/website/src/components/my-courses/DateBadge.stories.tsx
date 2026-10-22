import type { Meta, StoryObj } from '@storybook/react';
import { DateBadge } from './DateBadge';

const JUL_24_2PM_SEC = Math.floor(new Date('2026-07-24T14:00:00').getTime() / 1000);

const meta = {
  title: 'website/my-courses/DateBadge',
  component: DateBadge,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    dateTimeSeconds: JUL_24_2PM_SEC,
    isLive: false,
    layout: 'calendar',
  },
} satisfies Meta<typeof DateBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Calendar: Story = {};

export const CalendarLive: Story = {
  args: { isLive: true },
};

export const DateTime: Story = {
  args: { layout: 'dateTime' },
};

export const DateTimeLive: Story = {
  args: { layout: 'dateTime', isLive: true },
};

export const AllStates: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-start gap-6">
      <DateBadge {...args} />
      <DateBadge {...args} isLive />
      <DateBadge {...args} layout="dateTime" />
      <DateBadge {...args} layout="dateTime" isLive />
    </div>
  ),
};
