import type { Meta, StoryObj } from '@storybook/react';
import EmptyCourseList from './EmptyCourseList';

const meta = {
  title: 'website/my-courses/EmptyCourseList',
  component: EmptyCourseList,
  parameters: { layout: 'padded' },
  tags: ['autodocs'],
} satisfies Meta<typeof EmptyCourseList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Participant tabs: "Browse courses" CTA.
export const Participant: Story = {
  args: {
    title: 'No active courses',
    description: 'You\'re not currently enrolled in any active courses.',
    cta: { label: 'Browse courses', href: '/courses' },
  },
};

// Facilitator tabs: "Apply now to facilitate" CTA.
export const Facilitator: Story = {
  args: {
    title: 'No active courses',
    description: 'You\'re not facilitating any active courses right now.',
    cta: { label: 'Apply now to facilitate', href: '/join-us/facilitate' },
  },
};

export const TitleOnly: Story = {
  args: { title: 'No past courses' },
};
