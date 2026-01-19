import type { Meta, StoryObj } from '@storybook/react';
import { createMockCourse, createMockCourseRegistration } from '../../__tests__/testUtils';
import type { GroupDiscussion } from '../../server/routers/group-discussions';
import CourseDetails from './CourseDetails';

const courseId = 'course-1';
const mockCourse = createMockCourse({ id: courseId });
const mockCourseRegistration = createMockCourseRegistration({ courseId });

const now = Math.floor(Date.now() / 1000);
const hour = 60 * 60;

const mockDiscussions: Record<string, GroupDiscussion> = {
  'discussion-1': {
    id: 'discussion-1',
    facilitators: ['facilitator-1'],
    participantsExpected: ['participant-1'],
    attendees: [],
    startDateTime: now + 2 * hour,
    endDateTime: now + 3 * hour,
    group: 'group-1',
    zoomAccount: null,
    courseSite: null,
    unitNumber: 1,
    unit: null,
    unitFallback: '1: Introduction to AI Safety',
    zoomLink: 'https://zoom.us/j/123',
    activityDoc: null,
    slackChannelId: null,
    round: null,
    courseBuilderUnitRecordId: 'unit-1',
    autoNumberId: null,
    unitRecord: { unitNumber: '1', title: 'Introduction to AI Safety' } as GroupDiscussion['unitRecord'],
    groupDetails: { groupName: 'Group A' } as GroupDiscussion['groupDetails'],
  },
  'discussion-2': {
    id: 'discussion-2',
    facilitators: ['facilitator-1'],
    participantsExpected: ['participant-1'],
    attendees: [],
    startDateTime: now + 7 * 24 * hour,
    endDateTime: now + 7 * 24 * hour + hour,
    group: 'group-1',
    zoomAccount: null,
    courseSite: null,
    unitNumber: 2,
    unit: null,
    unitFallback: '2: AI Alignment',
    zoomLink: 'https://zoom.us/j/456',
    activityDoc: null,
    slackChannelId: null,
    round: null,
    courseBuilderUnitRecordId: 'unit-2',
    autoNumberId: null,
    unitRecord: { unitNumber: '2', title: 'AI Alignment' } as GroupDiscussion['unitRecord'],
    groupDetails: { groupName: 'Group A' } as GroupDiscussion['groupDetails'],
  },
  'discussion-3': {
    id: 'discussion-3',
    facilitators: ['facilitator-1'],
    participantsExpected: ['participant-1'],
    attendees: ['participant-1'],
    startDateTime: now - 7 * 24 * hour,
    endDateTime: now - 7 * 24 * hour + hour,
    group: 'group-1',
    zoomAccount: null,
    courseSite: null,
    unitNumber: 0,
    unit: null,
    unitFallback: '0: Kickoff',
    zoomLink: 'https://zoom.us/j/789',
    activityDoc: null,
    slackChannelId: null,
    round: null,
    courseBuilderUnitRecordId: 'unit-0',
    autoNumberId: null,
    unitRecord: { unitNumber: '0', title: 'Kickoff' } as GroupDiscussion['unitRecord'],
    groupDetails: { groupName: 'Group A' } as GroupDiscussion['groupDetails'],
  },
};

const meta: Meta<typeof CourseDetails> = {
  title: 'Settings/CourseDetails',
  component: CourseDetails,
  parameters: {
    layout: 'padded',
  },
  args: {
    course: mockCourse,
    attendedDiscussions: [mockDiscussions['discussion-3']!],
    upcomingDiscussions: [mockDiscussions['discussion-1']!, mockDiscussions['discussion-2']!],
    facilitatedDiscussions: [],
    isLoading: false,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    courseRegistration: { ...mockCourseRegistration, role: 'Participant' },
  },
};

export const Facilitator: Story = {
  args: {
    courseRegistration: { ...mockCourseRegistration, role: 'Facilitator' },
    attendedDiscussions: [],
    facilitatedDiscussions: [mockDiscussions['discussion-3']!],
  },
  parameters: {
    docs: {
      description: {
        story: 'Facilitators see "Facilitated discussions" tab instead of "Attended discussions".',
      },
    },
  },
};

export const LiveDiscussion: Story = {
  args: {
    courseRegistration: { ...mockCourseRegistration, role: 'Participant' },
    upcomingDiscussions: [
      {
        ...mockDiscussions['discussion-1']!,
        startDateTime: now - 15 * 60, // Started 15 minutes ago
        endDateTime: now + 45 * 60, // Ends in 45 minutes
        activityDoc: 'https://docs.google.com/document/d/abc123',
        slackChannelId: 'C1234567890',
      },
      mockDiscussions['discussion-2']!,
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'When a discussion is currently live, the time widget shows "NOW / LIVE" and the primary CTA is "Join now".',
      },
    },
  },
};
