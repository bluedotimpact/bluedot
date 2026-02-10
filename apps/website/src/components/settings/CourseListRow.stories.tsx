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
  roundStatus: 'Past',
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
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(mockFacilitatorMeetPerson),
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
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(mockMeetPerson),
    },
  },
};

// Past course, attended enough discussions, but hasn't submitted action plan
const mockAgiStrategyCourse = createMockCourse({
  title: 'AGI Strategy',
  slug: 'agi-strategy',
  path: '/courses/agi-strategy',
});

const mockPastNoCertRegistration = createMockCourseRegistration({
  roundStatus: 'Past',
  certificateId: null,
  certificateCreatedAt: null,
});

const pastDiscussions = Array.from({ length: 5 }, (_, i) => ({
  ...createMockGroupDiscussion({
    id: `disc-${i + 1}`,
    startDateTime: now - (10 - i) * hour,
    endDateTime: now - (9 - i) * hour,
  }),
  unitNumber: i + 1,
  unitRecord: { unitNumber: String(i + 1), title: `Unit ${i + 1}` } as GroupDiscussion['unitRecord'],
  groupDetails: mockDiscussion.groupDetails,
}));

export const MissingActionPlan: Story = {
  args: {
    course: mockAgiStrategyCourse,
    courseRegistration: mockPastNoCertRegistration,
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson({
          expectedDiscussionsParticipant: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
          attendedDiscussions: ['disc-1', 'disc-2', 'disc-3', 'disc-4'], // Attended 4 of 5 (allowed)
          groupsAsParticipant: ['group-1'],
          projectSubmission: null, // No action plan submitted
        })),
        trpcStorybookMsw.groupDiscussions.getByDiscussionIds.query(() => ({
          discussions: pastDiscussions,
        })),
      ],
    },
  },
};

export const LowAttendance: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockPastNoCertRegistration,
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.meetPerson.getByCourseRegistrationId.query(() => createMockMeetPerson({
          expectedDiscussionsParticipant: ['disc-1', 'disc-2', 'disc-3', 'disc-4', 'disc-5'],
          attendedDiscussions: ['disc-1', 'disc-2'], // Only attended 2 of 5 (missed too many)
          groupsAsParticipant: ['group-1'],
        })),
        trpcStorybookMsw.groupDiscussions.getByDiscussionIds.query(() => ({
          discussions: pastDiscussions,
        })),
      ],
    },
  },
};

const mockFutureInReviewRegistration = createMockCourseRegistration({
  roundStatus: 'Future',
  decision: null,
  roundId: 'round-future-1',
  certificateCreatedAt: null,
});

const mockFutureAcceptedRegistration = createMockCourseRegistration({
  roundStatus: 'Future',
  decision: 'Accept',
  roundId: 'round-future-1',
  certificateCreatedAt: null,
  availabilityIntervalsUTC: 'M09:00 M17:00',
});

const mockFutureRejectedRegistration = createMockCourseRegistration({
  roundStatus: 'Future',
  decision: 'Reject',
  roundId: 'round-future-1',
  certificateCreatedAt: null,
});

export const UpcomingInReview: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockFutureInReviewRegistration,
    roundStartDate: '2026-02-09',
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(null),
    },
  },
};

export const UpcomingAccepted: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockFutureAcceptedRegistration,
    roundStartDate: '2026-02-09',
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(null),
    },
  },
};

export const UpcomingRejected: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockFutureRejectedRegistration,
    roundStartDate: '2026-02-09',
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(null),
    },
  },
};
