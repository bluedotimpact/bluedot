import { CTALinkOrButton } from '@bluedot/ui';
import type { Meta, StoryObj } from '@storybook/react';
import ApplicationRow from './ApplicationRow';

const availabilityButton = (label: string) => (
  <CTALinkOrButton key="availability" variant="primary" size="small" url="https://availability.bluedot.org/form/bluedot-course" target="_blank" className="text-size-xxs">
    {label}
  </CTALinkOrButton>
);

const meta = {
  title: 'website/facilitator-applications/ApplicationRow',
  component: ApplicationRow,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
} satisfies Meta<typeof ApplicationRow>;

export default meta;
type Story = StoryObj<typeof meta>;

const base = {
  id: 'reg-1',
  courseTitle: 'Technical AI Safety',
  courseSlug: 'technical-ai-safety',
  roundName: 'Week 19 Intensive',
  roundFirstDiscussionDate: '2026-03-10',
  roundLastDiscussionDate: '2026-03-17',
};

export const Pending: Story = {
  args: { ...base, status: 'pending' },
};

export const PendingWithMenu: Story = {
  args: {
    ...base,
    status: 'pending',
    inlineActions: [availabilityButton('Share availability')],
    overflowItems: [{ id: 'withdraw', label: 'Withdraw application', onAction: () => {} }],
  },
};

export const PendingWithAvailabilitySubmitted: Story = {
  args: {
    ...base,
    status: 'pending',
    inlineActions: [availabilityButton('Edit availability')],
    overflowItems: [{ id: 'withdraw', label: 'Withdraw application', onAction: () => {} }],
  },
};

export const AcceptedWithGoToCourse: Story = {
  args: {
    ...base,
    status: 'accepted',
    overflowItems: [
      { id: 'go-to-course', label: 'Go to course', href: '/courses/technical-ai-safety' },
    ],
  },
};

export const PastAccepted: Story = {
  args: {
    ...base,
    roundFirstDiscussionDate: '2025-09-10',
    roundLastDiscussionDate: '2025-09-17',
    status: 'pastAccepted',
  },
};

export const PastNotPlaced: Story = {
  args: {
    ...base,
    roundFirstDiscussionDate: '2025-09-10',
    roundLastDiscussionDate: '2025-09-17',
    status: 'notPlaced',
  },
};

export const Withdrawn: Story = {
  args: {
    ...base,
    status: 'withdrawn',
  },
};
