import type { Meta, StoryObj } from '@storybook/react';
import type { MeetPerson } from '@bluedot/db';
import CourseListRow from './CourseListRow';
import type { GroupDiscussion } from '../../server/routers/groupDiscussionsRouter';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta: Meta<typeof CourseListRow> = {
  title: 'Settings/CourseListRow',
  component: CourseListRow,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock course data
const mockCourse = {
  id: 'course-1',
  title: 'Introduction to AI Safety',
  slug: 'intro-ai-safety',
  path: '/courses/intro-ai-safety',
  description: 'Learn the fundamentals of AI safety and alignment',
  shortDescription: 'AI safety basics',
  detailsUrl: '/courses/intro-ai-safety',
  displayOnCourseHubIndex: true,
  durationDescription: '8 weeks',
  durationHours: 40,
  units: ['unit-1', 'unit-2', 'unit-3'],
  cadence: 'Weekly',
  level: 'Beginner',
  status: 'Active',
  isNew: false,
  isFeatured: true,
  image: null,
  certificationBadgeImage: null,
  certificationDescription: null,
  averageRating: null,
  publicLastUpdated: null,
};

// Mock course registration for in-progress course
const mockInProgressRegistration = {
  id: 'reg-1',
  courseId: 'course-1',
  userId: 'user-1',
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  fullName: 'John Doe',
  role: 'Participant' as const,
  roundStatus: 'Active',
  certificateId: null,
  certificateCreatedAt: null,
  lastVisitedUnitNumber: null,
  lastVisitedChunkIndex: null,
  courseApplicationsBaseId: null,
  decision: null,
};

// Mock course registration for completed course
const mockCompletedRegistration = {
  ...mockInProgressRegistration,
  id: 'reg-2',
  roundStatus: 'Completed',
  certificateId: 'cert-123',
  certificateCreatedAt: 1700000000, // Timestamp for completed date
};

// Mock course registration for facilitator
const mockFacilitatorRegistration = {
  ...mockInProgressRegistration,
  id: 'reg-3',
  role: 'Facilitator' as const,
};

// Mock MeetPerson data
const now = Math.floor(Date.now() / 1000);
const hour = 60 * 60;

const mockMeetPerson: MeetPerson = {
  id: 'meet-person-1',
  name: 'John Doe',
  applicationsBaseRecordId: null,
  round: 'Round 1',
  expectedDiscussionsParticipant: ['discussion-1'],
  expectedDiscussionsFacilitator: [],
  attendedDiscussions: [],
  groupsAsParticipant: ['group-1'],
  buckets: ['bucket-1'],
  autoNumberId: 1,
};

const mockFacilitatorMeetPerson: MeetPerson = {
  ...mockMeetPerson,
  id: 'meet-person-3',
  expectedDiscussionsParticipant: [],
  expectedDiscussionsFacilitator: ['discussion-1'],
};

// Mock discussion data for the group-discussions tRPC endpoint
const mockDiscussion: GroupDiscussion = {
  id: 'discussion-1',
  facilitators: ['facilitator-1'],
  participantsExpected: ['participant-1'],
  attendees: [],
  startDateTime: now + 2 * hour,
  endDateTime: now + 3 * hour,
  group: 'group-1',
  groupId: 'group-1',
  zoomAccount: null,
  courseSite: null,
  unitNumber: 1,
  unit: null,
  zoomLink: 'https://zoom.us/j/123',
  activityDoc: null,
  slackChannelId: null,
  round: null,
  courseBuilderUnitRecordId: 'unit-1',
  autoNumberId: null,
  unitRecord: { unitNumber: '1', title: 'Introduction' } as GroupDiscussion['unitRecord'],
  groupDetails: {
    id: 'group-1',
    round: 'Round 1',
    autoNumberId: 1,
    groupName: 'Group A',
    groupDiscussions: ['discussion-1'],
    participants: ['participant-1'],
    whoCanSwitchIntoThisGroup: ['participant-1'],
    startTimeUtc: now,
  } as GroupDiscussion['groupDetails'],
};

// MSW handlers for tRPC calls
const createMswHandlers = (meetPerson: MeetPerson | null) => [
  trpcStorybookMsw.meetPerson.getByCourseRegistrationId.query(() => meetPerson),
  trpcStorybookMsw.groupDiscussions.getByDiscussionId.query(() => {
    return {
      discussion: mockDiscussion,
    };
  }),
];

export const InProgress: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockInProgressRegistration,
    isFirst: true,
    isLast: false,
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(mockMeetPerson),
    },
  },
};

export const Completed: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockCompletedRegistration,
    isFirst: false,
    isLast: true,
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(null),
    },
  },
};

export const Facilitator: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockFacilitatorRegistration,
    isFirst: true,
    isLast: true,
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(mockFacilitatorMeetPerson),
    },
  },
};

export const FirstInList: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockInProgressRegistration,
    isFirst: true,
    isLast: false,
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(mockMeetPerson),
    },
  },
};

export const LastInList: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockInProgressRegistration,
    isFirst: false,
    isLast: true,
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(mockMeetPerson),
    },
  },
};

export const OnlyItemInList: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockInProgressRegistration,
    isFirst: true,
    isLast: true,
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(mockMeetPerson),
    },
  },
};

export const LongTitle: Story = {
  args: {
    course: {
      ...mockCourse,
      title:
        'Advanced Machine Learning and Deep Neural Networks: A Comprehensive Introduction to Modern AI Techniques and Applications',
    },
    courseRegistration: mockInProgressRegistration,
    isFirst: true,
    isLast: true,
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(mockMeetPerson),
    },
  },
};
