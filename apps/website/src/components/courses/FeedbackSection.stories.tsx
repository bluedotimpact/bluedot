import type { Meta, StoryObj } from '@storybook/react';
import { RESOURCE_FEEDBACK } from '@bluedot/db/src/schema';
import FeedbackSection from './FeedbackSection';

const meta = {
  title: 'website/courses/FeedbackSection',
  component: FeedbackSection,
  tags: ['autodocs'],
  args: {},
} satisfies Meta<typeof FeedbackSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const CustomLeadingText: Story = {
  args: {
    leadingText: 'What did you think of this lesson?',
  },
};

export const Liked: Story = {
  args: {
    feedback: RESOURCE_FEEDBACK.LIKE,
  },
};

export const Disliked: Story = {
  args: {
    feedback: RESOURCE_FEEDBACK.DISLIKE,
  },
};
