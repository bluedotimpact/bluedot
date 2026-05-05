import type { Meta, StoryObj } from '@storybook/react';
import NextDiscussionCard from './NextDiscussionCard';

const meta = {
  title: 'website/my-courses/NextDiscussionCard',
  component: NextDiscussionCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    month: 'Apr',
    day: 28,
    title: 'Detecting danger',
    datetimeLabel: 'April 28, 2026, 4:00 - 5:00 PM',
    primaryHref: '/courses/technical-ai-safety/3/1',
    onReschedule: () => {},
  },
} satisfies Meta<typeof NextDiscussionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Next: Story = {
  args: { state: 'next', eyebrow: 'UNIT 3' },
};

export const StartingSoon: Story = {
  args: { state: 'soon', eyebrow: 'Starts in 16 minutes' },
};

export const Live: Story = {
  args: { state: 'live', eyebrow: 'LIVE', primaryHref: 'https://zoom.us/j/123' },
};
