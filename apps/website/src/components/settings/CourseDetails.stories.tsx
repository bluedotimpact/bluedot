import type { Meta, StoryObj } from '@storybook/react';
import type { MeetPerson } from '@bluedot/db';
import CourseDetails from './CourseDetails';
import { mockCourse as createMockCourse } from '../../__tests__/testUtils';
import type { GroupDiscussion } from '../../server/routers/group-discussions';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta: Meta<typeof CourseDetails> = {
  title: 'Settings/CourseDetails',
  component: CourseDetails,
  parameters: {
    layout: 'padded',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock course data
const mockCourse = createMockCourse();

// Mock course registration
const mockCourseRegistration = {
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

const mockMeetPerson: MeetPerson = {
  id: 'meet-person-1',
  name: 'John Doe',
  applicationsBaseRecordId: null,
  round: 'Round 1',
  expectedDiscussionsParticipant: ['discussion-1', 'discussion-2'],
  expectedDiscussionsFacilitator: [],
  attendedDiscussions: ['discussion-3'],
  groupsAsParticipant: ['group-1'],
  buckets: ['bucket-1'],
  autoNumberId: 1,
};

const mockFacilitatorMeetPerson: MeetPerson = {
  id: 'meet-person-2',
  name: 'Jane Facilitator',
  applicationsBaseRecordId: null,
  round: 'Round 1',
  expectedDiscussionsParticipant: [],
  expectedDiscussionsFacilitator: ['discussion-1', 'discussion-2'],
  attendedDiscussions: ['discussion-3'],
  groupsAsParticipant: ['group-1'],
  buckets: ['bucket-1'],
  autoNumberId: 2,
};

const createMswHandlers = (meetPerson: MeetPerson) => [
  trpcStorybookMsw.meetPerson.getByCourseRegistrationId.query(() => meetPerson),
  trpcStorybookMsw.groupDiscussions.getByDiscussionIds.query(({ input }) => {
    const discussions = input.discussionIds
      .map((id) => mockDiscussions[id])
      .filter((d) => d !== undefined);

    return {
      discussions,
    };
  }),
];

export const Default: Story = {
  args: {
    course: mockCourse,
    courseRegistration: mockCourseRegistration,
  },
  parameters: {
    msw: {
      handlers: createMswHandlers(mockMeetPerson),
    },
  },
};

export const Facilitator: Story = {
  args: {
    course: mockCourse,
    courseRegistration: { ...mockCourseRegistration, role: 'Facilitator' },
  },
  parameters: {
    docs: {
      description: {
        story: 'Facilitators do not see the "Switch group" button for discussions.',
      },
    },
    msw: {
      handlers: createMswHandlers(mockFacilitatorMeetPerson),
    },
  },
};
