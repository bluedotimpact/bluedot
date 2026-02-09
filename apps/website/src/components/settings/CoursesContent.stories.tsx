import type { Meta, StoryObj } from '@storybook/react';
import type {
  Course,
  CourseRegistration,
  MeetPerson,
} from '@bluedot/db';
import type { GroupDiscussion } from '../../server/routers/group-discussions';
import CoursesContent from './CoursesContent';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import {
  createMockCourse,
  createMockCourseRegistration,
  createMockMeetPerson,
  createMockGroupDiscussion,
} from '../../__tests__/testUtils';

const meta: Meta<typeof CoursesContent> = {
  title: 'Settings/CoursesContent',
  component: CoursesContent,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockCourse1 = createMockCourse({
  id: 'course-1',
  title: 'Introduction to AI Safety',
  slug: 'intro-ai-safety',
});

const mockCourse2 = createMockCourse({
  id: 'course-2',
  title: 'Advanced AI Safety',
  slug: 'advanced-ai-safety',
});

const mockRegistrationInProgress = createMockCourseRegistration({
  id: 'reg-1',
  courseId: 'course-1',
  roundStatus: 'Active',
  certificateCreatedAt: null,
});

const mockRegistrationCompleted = createMockCourseRegistration({
  id: 'reg-2',
  courseId: 'course-2',
  roundStatus: 'Past',
  certificateCreatedAt: 1672531200, // Jan 1 2023
});

const mockRegistrationActiveWithCert = createMockCourseRegistration({
  id: 'reg-3',
  courseId: 'course-1',
  roundStatus: 'Active',
  certificateCreatedAt: 1672531200,
});

const mockRegistrationFacilitated = createMockCourseRegistration({
  id: 'reg-4',
  courseId: 'course-2',
  roundStatus: 'Past',
  role: 'Facilitator',
  roundName: 'AGI Strategy (2025 Aug W35) - Intensive',
});

const mockRegistrationDroppedOut = createMockCourseRegistration({
  id: 'reg-dropped',
  courseId: 'course-1',
  roundStatus: 'Active',
  certificateCreatedAt: null,
  dropoutId: ['dropout-1'], // Has dropoutId but no deferredId = dropped out
});

const mockRegistrationDeferred = createMockCourseRegistration({
  id: 'reg-deferred',
  courseId: 'course-2',
  roundStatus: 'Active',
  certificateCreatedAt: null,
  deferredId: ['deferred-1'], // Has deferredId but no dropoutId = deferred
});

const mockRegistrationFuturePending = createMockCourseRegistration({
  id: 'reg-future-pending',
  courseId: 'course-1',
  roundStatus: 'Future',
  decision: null,
  roundId: 'round-future-1',
  certificateCreatedAt: null,
});

const mockRegistrationFutureAccepted = createMockCourseRegistration({
  id: 'reg-future-accepted',
  courseId: 'course-1',
  roundStatus: 'Future',
  decision: 'Accept',
  roundId: 'round-future-1',
  certificateCreatedAt: null,
  availabilityIntervalsUTC: 'M09:00 M17:00',
});

const mockRegistrationFutureRejected = createMockCourseRegistration({
  id: 'reg-future-rejected',
  courseId: 'course-2',
  roundStatus: 'Future',
  decision: 'Reject',
  roundId: 'round-future-2',
  certificateCreatedAt: null,
});

const mockMeetPerson = createMockMeetPerson({
  id: 'meet-person-1',
  expectedDiscussionsParticipant: ['discussion-1'],
  attendedDiscussions: [],
  groupsAsParticipant: ['group-1'],
});

const now = Math.floor(Date.now() / 1000);
const hour = 60 * 60;
const mockDiscussion: GroupDiscussion = {
  ...createMockGroupDiscussion({
    id: 'discussion-1',
    startDateTime: now + hour, // Starts in 1 hour
    endDateTime: now + 2 * hour, // Ends in 2 hours
    unitNumber: 1,
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

const createHandlers = ({
  registrations = [],
  courses = [],
  meetPerson = mockMeetPerson,
  discussions = [mockDiscussion],
  roundStartDates = {},
  error = false,
}: {
  registrations?: CourseRegistration[];
  courses?: Course[];
  meetPerson?: MeetPerson | null;
  discussions?: GroupDiscussion[];
  roundStartDates?: Record<string, string | null>;
  error?: boolean;
} = {}) => {
  if (error) {
    return [
      trpcStorybookMsw.courseRegistrations.getAll.query(() => {
        throw new Error('Failed to fetch');
      }),
      trpcStorybookMsw.courses.getAll.query(() => {
        throw new Error('Failed to fetch');
      }),
    ];
  }

  return [
    trpcStorybookMsw.courseRegistrations.getAll.query(() => registrations),
    trpcStorybookMsw.courses.getAll.query(() => courses),
    trpcStorybookMsw.meetPerson.getByCourseRegistrationId.query(() => meetPerson),
    trpcStorybookMsw.groupDiscussions.getByDiscussionIds.query(() => ({
      discussions,
    })),
    trpcStorybookMsw.courseRegistrations.getRoundStartDates.query(() => roundStartDates),
  ];
};

export const Default: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationInProgress, mockRegistrationCompleted],
        courses: [mockCourse1, mockCourse2],
      }),
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [],
        courses: [],
      }),
    },
  },
};

export const OnlyInProgress: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationInProgress],
        courses: [mockCourse1],
      }),
    },
  },
};

export const OnlyCompleted: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationCompleted],
        courses: [mockCourse2],
      }),
    },
  },
};

export const ActiveWithCertificate: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationActiveWithCert],
        courses: [mockCourse1],
      }),
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({ error: true }),
    },
  },
};

export const WithFacilitated: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationInProgress, mockRegistrationCompleted, mockRegistrationFacilitated],
        courses: [mockCourse1, mockCourse2],
      }),
    },
  },
};

export const WithDroppedOutCourse: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationDroppedOut],
        courses: [mockCourse1],
      }),
    },
  },
};

export const WithDeferredCourse: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationDeferred],
        courses: [mockCourse2],
      }),
    },
  },
};

export const MixedWithDropoutAndDeferred: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [
          mockRegistrationInProgress, // Normal in-progress course
          mockRegistrationDroppedOut, // Should be filtered out
          mockRegistrationDeferred, // Should appear (deferred)
          mockRegistrationCompleted, // Normal completed course
        ],
        courses: [mockCourse1, mockCourse2],
      }),
    },
  },
};

export const UpcomingInReview: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationFuturePending],
        courses: [mockCourse1],
        roundStartDates: { 'round-future-1': '2026-02-09' },
      }),
    },
  },
};

export const UpcomingAccepted: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationFutureAccepted],
        courses: [mockCourse1],
        roundStartDates: { 'round-future-1': '2026-02-09' },
      }),
    },
  },
};

export const UpcomingRejected: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationFutureRejected],
        courses: [mockCourse2],
        roundStartDates: { 'round-future-2': '2026-03-15' },
      }),
    },
  },
};

export const UpcomingWithAvailability: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationFutureAccepted],
        courses: [mockCourse1],
        roundStartDates: { 'round-future-1': '2026-02-09' },
      }),
    },
  },
};

export const MixedUpcomingAndInProgress: Story = {
  parameters: {
    msw: {
      handlers: createHandlers({
        registrations: [mockRegistrationFuturePending, mockRegistrationInProgress, mockRegistrationCompleted],
        courses: [mockCourse1, mockCourse2],
        roundStartDates: { 'round-future-1': '2026-02-09' },
      }),
    },
  },
};
