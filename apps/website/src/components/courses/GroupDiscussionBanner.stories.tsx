import type { Meta, StoryObj } from '@storybook/react';
import GroupDiscussionBanner from './GroupDiscussionBanner';
import { createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';

const mockUnit = createMockUnit();

const mockGroupDiscussion = createMockGroupDiscussion({
  startDateTime: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
  endDateTime: Math.floor(Date.now() / 1000) + 5400, // 90 minutes from now
});

const meta = {
  title: 'website/courses/GroupDiscussionBanner',
  component: GroupDiscussionBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  args: {
    unit: mockUnit,
    groupDiscussion: mockGroupDiscussion,
  },
  argTypes: {
    userRole: {
      control: { type: 'select' },
      options: ['participant', 'facilitator'],
    },
    hostKeyForFacilitators: {
      control: { type: 'text' },
    },
  },
} satisfies Meta<typeof GroupDiscussionBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

// Participant view with discussion live
export const ParticipantLive: Story = {
  args: {
    userRole: 'participant',
    groupDiscussion: {
      ...mockGroupDiscussion,
      startDateTime: Math.floor(Date.now() / 1000) - 600, // Started 10 minutes ago (LIVE)
      endDateTime: Math.floor(Date.now() / 1000) + 2700, // Ends in 45 minutes
    },
  },
};

// Participant view with discussion starting soon
export const ParticipantStartingSoon: Story = {
  args: {
    userRole: 'participant',
  },
};

// Participant view with discussion not starting soon
export const ParticipantNotStartingSoon: Story = {
  args: {
    userRole: 'participant',
    groupDiscussion: {
      ...mockGroupDiscussion,
      startDateTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
      endDateTime: Math.floor(Date.now() / 1000) + 10800, // 3 hours from now
    },
  },
};

// Facilitator view with host key and discussion live
export const FacilitatorLive: Story = {
  args: {
    userRole: 'facilitator',
    hostKeyForFacilitators: '123456',
    groupDiscussion: {
      ...mockGroupDiscussion,
      startDateTime: Math.floor(Date.now() / 1000) - 600, // Started 10 minutes ago (LIVE)
      endDateTime: Math.floor(Date.now() / 1000) + 2700, // Ends in 45 minutes
    },
  },
};

// Facilitator view with host key and discussion starting soon
export const FacilitatorStartingSoon: Story = {
  args: {
    userRole: 'facilitator',
    hostKeyForFacilitators: '123456',
  },
};

// Facilitator view with discussion not starting soon
export const FacilitatorNotStartingSoon: Story = {
  args: {
    userRole: 'facilitator',
    hostKeyForFacilitators: '123456',
    groupDiscussion: {
      ...mockGroupDiscussion,
      startDateTime: Math.floor(Date.now() / 1000) + 7200, // 2 hours from now
      endDateTime: Math.floor(Date.now() / 1000) + 10800, // 3 hours from now
    },
  },
};
