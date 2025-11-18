import type { Meta, StoryObj } from '@storybook/react';
import GroupDiscussionBanner from './GroupDiscussionBanner';

const mockUnit = {
  id: 'unit-123',
  title: 'Introduction to AI Safety',
  unitNumber: '1',
  courseSlug: 'ai-safety-fundamentals',
  path: '/courses/ai-safety-fundamentals/1',
  content: 'Unit content',
  description: 'Unit description',
  duration: 60,
  autoNumberId: 1,
  chunks: ['chunk-1'],
  courseId: 'course-123',
  courseTitle: 'AI Safety Fundamentals',
  coursePath: '/courses/ai-safety-fundamentals',
  learningOutcomes: 'Learning outcomes',
  menuText: 'Menu text',
  unitPodcastUrl: null,
  courseUnit: 'course-unit-123',
  unitStatus: 'active',
};

const mockGroupDiscussion = {
  id: 'discussion-123',
  facilitators: ['facilitator-1'],
  participantsExpected: ['participant-1'],
  attendees: [],
  startDateTime: Math.floor(Date.now() / 1000) + 1800, // 30 minutes from now
  endDateTime: Math.floor(Date.now() / 1000) + 5400, // 90 minutes from now
  // startDateTime: Math.floor(Date.now() / 1000) - 600, // Started 10 minutes ago (LIVE)
  // endDateTime: Math.floor(Date.now() / 1000) + 2700, // Ends in 45 minutes
  group: 'group-123',
  zoomAccount: 'zoom-account-123',
  courseSite: 'site-123',
  unitNumber: 1,
  unit: 'unit-123',
  zoomLink: 'https://zoom.us/j/123456789',
  activityDoc: 'https://docs.google.com/document/d/abc123',
  slackChannelId: 'C1234567890',
  round: 'round-123',
  courseBuilderUnitRecordId: 'unit-123',
  autoNumberId: 1,
};

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
    onClickPrepare: () => {
      // eslint-disable-next-line no-alert
      alert('[Debug action for storybook] onClickPrepare called');
    },
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
