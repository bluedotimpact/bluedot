import type { Meta, StoryObj } from '@storybook/react';
import NextDiscussionCard from './NextDiscussionCard';

const NextEyebrow = (
  <>
    <span className="hidden sm:inline">TECHNICAL AI SAFETY: </span>
    UNIT 3
  </>
);

const meta = {
  title: 'website/my-courses/NextDiscussionCard',
  component: NextDiscussionCard,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
  args: {
    month: 'Apr',
    day: 28,
    title: 'Detecting danger',
    datetimeLabel: 'Apr 28, 4:00 PM - 5:00 PM',
    primaryHref: '/courses/technical-ai-safety/3/1',
    onReschedule: () => {},
  },
} satisfies Meta<typeof NextDiscussionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllStates: Story = {
  args: { state: 'next', eyebrow: NextEyebrow },
  render: (args) => (
    <div className="flex flex-col gap-4">
      <NextDiscussionCard {...args} state="next" eyebrow={NextEyebrow} />
      <NextDiscussionCard {...args} state="soon" eyebrow="Starts in 16 minutes" />
      <NextDiscussionCard {...args} state="live" eyebrow="LIVE" primaryHref="https://zoom.us/j/123" />
    </div>
  ),
};

export const Next: Story = {
  args: { state: 'next', eyebrow: NextEyebrow },
};

export const StartingSoon: Story = {
  args: { state: 'soon', eyebrow: 'Starts in 16 minutes' },
};

export const Live: Story = {
  args: { state: 'live', eyebrow: 'LIVE', primaryHref: 'https://zoom.us/j/123' },
};
