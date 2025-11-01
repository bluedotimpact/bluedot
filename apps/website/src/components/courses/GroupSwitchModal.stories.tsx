import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { http, HttpResponse, delay } from 'msw';
import type { Course, Unit } from '@bluedot/db';
import GroupSwitchModal from './GroupSwitchModal';
import { GetGroupSwitchingAvailableResponse } from '../../pages/api/courses/[courseSlug]/group-switching/available';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

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
  courseUnit: '1',
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
  courseUnit: '2',
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
  courseUnit: '3',
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
        startTimeUtc: Math.floor(new Date('2024-01-01T09:00:00Z').getTime() / 1000), // 9:00 AM UTC
        whoCanSwitchIntoThisGroup: [],
      },
      userIsParticipant: true,
      spotsLeftIfKnown: 0,
      allDiscussionsHaveStarted: false,
    },
    {
      group: {
        id: 'group-2',
        groupName: 'Evening Group B',
        autoNumberId: null,
        groupDiscussions: [],
        round: '',
        participants: [],
        startTimeUtc: Math.floor(new Date('2024-01-01T19:00:00Z').getTime() / 1000), // 7:00 PM UTC
        whoCanSwitchIntoThisGroup: [],
      },
      userIsParticipant: false,
      spotsLeftIfKnown: 3,
      allDiscussionsHaveStarted: false,
    },
    {
      group: {
        id: 'group-3',
        groupName: 'Weekend Group C',
        autoNumberId: null,
        groupDiscussions: [],
        round: '',
        participants: [],
        startTimeUtc: Math.floor(new Date('2024-01-06T14:00:00Z').getTime() / 1000), // Saturday 2:00 PM UTC
        whoCanSwitchIntoThisGroup: [],
      },
      userIsParticipant: false,
      spotsLeftIfKnown: 0,
      allDiscussionsHaveStarted: false,
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
        spotsLeftIfKnown: 0,
        hasStarted: false,
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
        spotsLeftIfKnown: 2,
        hasStarted: false,
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
        spotsLeftIfKnown: 1,
        hasStarted: false,
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
    initialUnitNumber: unit1.unitNumber,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getBySlug.query(async () => {
          return mockCourseData;
        }),
        http.get('/api/courses/ai-safety/group-switching/available', () => {
          return HttpResponse.json(mockSwitchingData);
        }),
        http.post('/api/courses/ai-safety/group-switching', () => {
          return HttpResponse.json({ type: 'success' });
        }),
      ],
    },
  },
};

export const AlternativeUnit: Story = {
  args: {
    handleClose: () => {},
    initialUnitNumber: unit2.unitNumber,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getBySlug.query(async () => {
          return mockCourseData;
        }),
        http.get('/api/courses/ai-safety/group-switching/available', () => {
          return HttpResponse.json(mockSwitchingData);
        }),
        http.post('/api/courses/ai-safety/group-switching', () => {
          return HttpResponse.json({ type: 'success' });
        }),
      ],
    },
  },
};

export const NoAvailableGroups: Story = {
  args: {
    handleClose: () => {},
    initialUnitNumber: unit3.unitNumber,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getBySlug.query(async () => {
          return mockCourseData;
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
    initialUnitNumber: unit1.unitNumber,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courses.getBySlug.query(async () => {
          // You may need to reload the page to force this delay and see the loading state.
          await delay(2000);
          return mockCourseData;
        }),
        http.get('/api/courses/ai-safety/group-switching/available', async () => {
          await delay(2000);
          return HttpResponse.json(mockSwitchingData);
        }),
        http.post('/api/courses/ai-safety/group-switching', () => {
          return HttpResponse.json({ type: 'success' });
        }),
      ],
    },
  },
};
