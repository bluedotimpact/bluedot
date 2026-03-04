import type { Meta, StoryObj } from '@storybook/react';
import GroupDiscussionBanner from './GroupDiscussionBanner';
import { createMockGroupDiscussion, createMockUnit } from '../../__tests__/testUtils';
import { ONE_HOUR_SECONDS, ONE_MINUTE_SECONDS } from '../../lib/constants';

const mockUnit = createMockUnit();

const mockGroupDiscussion = createMockGroupDiscussion({
  startDateTime: Math.floor(Date.now() / 1000) + 30 * ONE_MINUTE_SECONDS,
  endDateTime: Math.floor(Date.now() / 1000) + 90 * ONE_MINUTE_SECONDS,
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
      startDateTime: Math.floor(Date.now() / 1000) - 10 * ONE_MINUTE_SECONDS, // LIVE
      endDateTime: Math.floor(Date.now() / 1000) + 45 * ONE_MINUTE_SECONDS,
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
      startDateTime: Math.floor(Date.now() / 1000) + 2 * ONE_HOUR_SECONDS,
      endDateTime: Math.floor(Date.now() / 1000) + 3 * ONE_HOUR_SECONDS,
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
      startDateTime: Math.floor(Date.now() / 1000) - 10 * ONE_MINUTE_SECONDS, // LIVE
      endDateTime: Math.floor(Date.now() / 1000) + 45 * ONE_MINUTE_SECONDS,
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
      startDateTime: Math.floor(Date.now() / 1000) + 2 * ONE_HOUR_SECONDS,
      endDateTime: Math.floor(Date.now() / 1000) + 3 * ONE_HOUR_SECONDS,
    },
  },
};
