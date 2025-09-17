import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { http, HttpResponse, delay } from 'msw';
import type { Course, Unit } from '@bluedot/db';
import GroupSwitchModal from './GroupSwitchModal';
import { GetGroupSwitchingAvailableResponse } from '../../pages/api/courses/[courseSlug]/group-switching/available';

const unit1: Unit = {
  id: 'unit-1',
  duration: null,
  description: 'Introduction to AI Safety concepts',
  autoNumberId: 1,
  path: '/courses/ai-safety/unit-1',
  title: 'Introduction to AI Safety',
  unitNumber: '1',
  chunks: null,
  courseId: 'course-1',
  courseTitle: 'AI Safety Course',
  coursePath: '/courses/ai-safety',
  courseSlug: 'ai-safety',
  content: null,
  menuText: null,
  learningOutcomes: null,
  unitPodcastUrl: null,
  unitStatus: 'published',
};

const unit2: Unit = {
  id: 'unit-2',
  duration: null,
  description: 'AI alignment concepts',
  autoNumberId: 2,
  path: '/courses/ai-safety/unit-2',
  title: 'AI Alignment',
  unitNumber: '2',
  chunks: null,
  courseId: 'course-1',
  courseTitle: 'AI Safety Course',
  coursePath: '/courses/ai-safety',
  courseSlug: 'ai-safety',
  content: null,
  menuText: null,
  learningOutcomes: null,
  unitPodcastUrl: null,
  unitStatus: 'published',
};

const unit3: Unit = {
  id: 'unit-3',
  duration: null,
  description: 'Technical safety approaches',
  autoNumberId: 3,
  path: '/courses/ai-safety/unit-3',
  title: 'Technical Safety',
  unitNumber: '3',
  chunks: null,
  courseId: 'course-1',
  courseTitle: 'AI Safety Course',
  coursePath: '/courses/ai-safety',
  courseSlug: 'ai-safety',
  content: null,
  menuText: null,
  learningOutcomes: null,
  unitPodcastUrl: null,
  unitStatus: 'published',
};

const mockCourseData: { course: Course, units: Unit[] } = {
  course: {
    id: 'course-1',
    title: 'AI Safety Course',
    slug: 'ai-safety',
    description: 'Learn about AI safety',
    path: '',
    certificationBadgeImage: null,
    certificationDescription: null,
    detailsUrl: '',
    displayOnCourseHubIndex: false,
    durationDescription: '',
    durationHours: null,
    image: null,
    shortDescription: '',
    units: [],
    cadence: '',
    level: '',
    averageRating: null,
    publicLastUpdated: null,
    isNew: false,
    isFeatured: false,
    status: null,
  },
  units: [
    unit1,
    unit2,
    unit3,
  ],
};

const mockSwitchingData: GetGroupSwitchingAvailableResponse = {
  groupsAvailable: [
    {
      group: {
        id: 'group-1',
        groupName: 'Morning Group A',
        autoNumberId: null,
        groupDiscussions: [],
        round: '',
        participants: [],
        whoCanSwitchIntoThisGroup: [],
      },
      userIsParticipant: true,
      spotsLeft: 0,
      nextDiscussionStartDateTime: Math.floor((Date.now() + 2 * 60 * 60 * 1000) / 1000), // 2 hours from now
    },
    {
      group: {
        id: 'group-2',
        groupName: 'Evening Group B',
        autoNumberId: null,
        groupDiscussions: [],
        round: '',
        participants: [],
        whoCanSwitchIntoThisGroup: [],
      },
      userIsParticipant: false,
      spotsLeft: 3,
      nextDiscussionStartDateTime: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours from now
    },
    {
      group: {
        id: 'group-3',
        groupName: 'Weekend Group C',
        autoNumberId: null,
        groupDiscussions: [],
        round: '',
        participants: [],
        whoCanSwitchIntoThisGroup: [],
      },
      userIsParticipant: false,
      spotsLeft: 0,
      nextDiscussionStartDateTime: Math.floor((Date.now() + 48 * 60 * 60 * 1000) / 1000), // 48 hours from now
    },
  ],
  discussionsAvailable: {
    1: [
      {
        discussion: {
          id: 'discussion-1',
          startDateTime: Math.floor((Date.now() + 2 * 60 * 60 * 1000) / 1000), // 2 hours from now
          unit: null,
          unitNumber: null,
          autoNumberId: null,
          group: '',
          round: null,
          facilitators: [],
          participantsExpected: [],
          attendees: [],
          endDateTime: 0,
          zoomAccount: null,
          courseSite: null,
          zoomLink: null,
          activityDoc: null,
          slackChannelId: null,
          courseBuilderUnitRecordId: null,
        },
        groupName: 'Morning Group A',
        userIsParticipant: true,
        spotsLeft: 0,
      },
      {
        discussion: {
          id: 'discussion-2',
          startDateTime: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours from now
          group: '',
          round: null,
          autoNumberId: null,
          facilitators: [],
          participantsExpected: [],
          attendees: [],
          endDateTime: 0,
          zoomAccount: null,
          courseSite: null,
          unitNumber: null,
          unit: null,
          zoomLink: null,
          activityDoc: null,
          slackChannelId: null,
          courseBuilderUnitRecordId: null,
        },
        groupName: 'Evening Group B',
        userIsParticipant: false,
        spotsLeft: 2,
      },
    ],
    2: [
      {
        discussion: {
          id: 'discussion-3',
          startDateTime: Math.floor((Date.now() + 48 * 60 * 60 * 1000) / 1000), // 48 hours from now
          unit: null,
          unitNumber: null,
          autoNumberId: null,
          group: '',
          round: null,
          facilitators: [],
          participantsExpected: [],
          attendees: [],
          endDateTime: 0,
          zoomAccount: null,
          courseSite: null,
          zoomLink: null,
          activityDoc: null,
          slackChannelId: null,
          courseBuilderUnitRecordId: null,
        },
        groupName: 'Weekend Group C',
        userIsParticipant: false,
        spotsLeft: 1,
      },
    ],
  },
  type: 'success',
};

const meta = {
  title: 'website/courses/GroupSwitchModal',
  component: GroupSwitchModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof GroupSwitchModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    handleClose: () => {},
    currentUnit: unit1,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/courses/ai-safety', () => {
          return HttpResponse.json(mockCourseData);
        }),
        http.get('/api/courses/ai-safety/group-switching/available', () => {
          return HttpResponse.json(mockSwitchingData);
        }),
      ],
    },
  },
};

export const WithDifferentUnit: Story = {
  args: {
    handleClose: () => {},
    currentUnit: unit2,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/courses/ai-safety', () => {
          return HttpResponse.json(mockCourseData);
        }),
        http.get('/api/courses/ai-safety/group-switching/available', () => {
          return HttpResponse.json(mockSwitchingData);
        }),
      ],
    },
  },
};

export const Loading: Story = {
  args: {
    handleClose: () => {},
    currentUnit: unit1,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: [
        http.get('/api/courses/ai-safety', async () => {
          await delay(2000);
          return HttpResponse.json(mockCourseData);
        }),
        http.get('/api/courses/ai-safety/group-switching/available', async () => {
          await delay(2000);
          return HttpResponse.json(mockSwitchingData);
        }),
      ],
    },
  },
};
