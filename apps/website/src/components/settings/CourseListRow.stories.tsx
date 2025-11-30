import type { Meta, StoryObj } from '@storybook/react';
import type { MeetPerson } from '@bluedot/db';
import CourseListRow from './CourseListRow';
import type { GroupDiscussion } from '../../server/routers/group-discussions';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import {
  createMockCourse,
  createMockCourseRegistration,
  createMockMeetPerson,
  createMockGroupDiscussion,
} from '../../__tests__/testUtils';

const meta: Meta<typeof CourseListRow> = {
  title: 'Settings/CourseListRow',
  component: CourseListRow,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockCourse = createMockCourse({
  title: 'Introduction to AI Safety',
  slug: 'intro-ai-safety',
  path: '/courses/intro-ai-safety',
});

// Mock course registration for in-progress course
const mockInProgressRegistration = createMockCourseRegistration();

// Mock course registration for completed course
const mockCompletedRegistration = createMockCourseRegistration({
  roundStatus: 'Completed',
  certificateId: 'cert-123',
  certificateCreatedAt: 1700000000,
});

const mockFacilitatorRegistration = createMockCourseRegistration({
  role: 'Facilitator',
});

const mockMeetPerson = createMockMeetPerson({
  expectedDiscussionsParticipant: ['discussion-1'],
  groupsAsParticipant: ['group-1'],
});

const mockFacilitatorMeetPerson = createMockMeetPerson({
  expectedDiscussionsFacilitator: ['discussion-1'],
  groupsAsParticipant: ['group-1'],
});

const now = Math.floor(Date.now() / 1000);
const hour = 60 * 60;

const mockDiscussion: GroupDiscussion = {
  ...createMockGroupDiscussion({
    facilitators: ['facilitator-1'],
    participantsExpected: ['participant-1'],
    startDateTime: now + 2 * hour,
    endDateTime: now + 3 * hour,
    group: 'group-1',
    zoomLink: 'https://zoom.us/j/123',
  }),
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
  trpcStorybookMsw.groupDiscussions.getByDiscussionIds.query(() => {
    return {
      discussions: [mockDiscussion],
    };
  }),
];

export const InProgress: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockInProgressRegistration,
    isFirst: true,
    isLast: false,
    isCompleted: false,
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
    isCompleted: true,
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
