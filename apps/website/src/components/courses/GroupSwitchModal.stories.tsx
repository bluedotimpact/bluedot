import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { delay } from 'msw';
import type { Course, Unit } from '@bluedot/db';
import GroupSwitchModal from './GroupSwitchModal';
import type { DiscussionsAvailable } from '../../server/routers/group-switching';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import {
  createMockCourse, createMockCourseRegistration, createMockGroup, createMockGroupDiscussion, createMockUnit,
} from '../../__tests__/testUtils';

const unit1 = createMockUnit({
  title: 'Introduction to AI Safety',
  unitNumber: '1',
});

const unit2 = createMockUnit({
  title: 'AI Safety Course',
  unitNumber: '2',
});

const unit3 = createMockUnit({
  title: 'Technical Safety Approaches',
  unitNumber: '3',
});

const mockCourseData: { course: Course; units: Unit[] } = {
  course: createMockCourse(),
  units: [
    unit1,
    unit2,
    unit3,
  ],
};

const mockUser = {
  id: 'user-1',
  email: 'test@bluedot.org',
  name: 'Test User',
  lastSeenAt: new Date().toISOString(),
  autoNumberId: null,
  createdAt: null,
  utmSource: null,
  utmCampaign: null,
  utmContent: null,
  isAdmin: null,
};

const mockCourseRegistration = createMockCourseRegistration({
  roundId: 'round-1',
});

const mockAvailableGroupsAndDiscussions: DiscussionsAvailable = {
  groupsAvailable: [
    {
      group: createMockGroup({
        id: 'group-1',
        groupName: 'Morning Group A',
        startTimeUtc: Math.floor(new Date('2024-01-01T09:00:00Z').getTime() / 1000), // 9:00 AM UTC
      }),
      userIsParticipant: true,
      spotsLeftIfKnown: 0,
    },
    {
      group: createMockGroup({
        id: 'group-2',
        groupName: 'Evening Group B',
        startTimeUtc: Math.floor(new Date('2024-01-01T19:00:00Z').getTime() / 1000), // 7:00 PM UTC
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 3,
    },
    {
      group: createMockGroup({
        id: 'group-3',
        groupName: 'Weekend Group C',
        startTimeUtc: Math.floor(new Date('2024-01-06T14:00:00Z').getTime() / 1000), // Saturday 2:00 PM UTC
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 0,
    },
  ],
  discussionsAvailable: {
    1: [
      {
        discussion: createMockGroupDiscussion({
          startDateTime: Math.floor((Date.now() + 2 * 60 * 60 * 1000) / 1000), // 2 hours from now
        }),
        groupName: 'Morning Group A',
        userIsParticipant: true,
        spotsLeftIfKnown: 0,
      },
      {
        discussion: createMockGroupDiscussion({
          startDateTime: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours from now
        }),
        groupName: 'Evening Group B',
        userIsParticipant: false,
        spotsLeftIfKnown: 2,
      },
    ],
    2: [
      {
        discussion: createMockGroupDiscussion({
          startDateTime: Math.floor((Date.now() + 48 * 60 * 60 * 1000) / 1000), // 48 hours from now
        }),
        groupName: 'Weekend Group C',
        userIsParticipant: false,
        spotsLeftIfKnown: 1,
      },
    ],
  },
};

const manyGroupNames = [
  'Monday 9am ET',
  'Monday 2pm ET',
  'Monday 7pm ET',
  'Tuesday 10am ET',
  'Tuesday 3pm ET',
  'Tuesday 8pm ET',
  'Wednesday 9am ET',
  'Wednesday 1pm ET',
  'Wednesday 6pm ET',
  'Thursday 11am ET',
];

const mockManyGroupsData: DiscussionsAvailable = {
  groupsAvailable: [
    {
      group: createMockGroup({ id: 'group-current', groupName: 'Monday 9am ET', startTimeUtc: Math.floor(new Date('2024-01-01T14:00:00Z').getTime() / 1000) }),
      userIsParticipant: true,
      spotsLeftIfKnown: 0,
    },
    ...manyGroupNames.slice(1).map((name, i) => ({
      group: createMockGroup({
        id: `group-${i + 2}`,
        groupName: name,
        startTimeUtc: Math.floor(new Date('2024-01-01T14:00:00Z').getTime() / 1000) + (i + 1) * 3600 * 5,
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: i === 5 ? 0 : i + 1,
    })),
  ],
  discussionsAvailable: {
    1: [
      {
        discussion: createMockGroupDiscussion({ id: 'disc-current', startDateTime: Math.floor((Date.now() + 2 * 60 * 60 * 1000) / 1000) }),
        groupName: 'Monday 9am ET',
        userIsParticipant: true,
        spotsLeftIfKnown: 0,
      },
      ...manyGroupNames.slice(1).map((name, i) => ({
        discussion: createMockGroupDiscussion({
          id: `disc-${i + 2}`,
          startDateTime: Math.floor((Date.now() + (i + 1) * 12 * 60 * 60 * 1000) / 1000),
        }),
        groupName: name,
        userIsParticipant: false,
        spotsLeftIfKnown: i === 5 ? 0 : i + 1,
      })),
    ],
  },
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

const commonHandlers = [
  trpcStorybookMsw.users.getUser.query(() => mockUser),
  trpcStorybookMsw.courses.getBySlug.query(() => mockCourseData),
  trpcStorybookMsw.courseRegistrations.getByCourseId.query(() => mockCourseRegistration),
  trpcStorybookMsw.groupSwitching.discussionsAvailable.query(() => mockAvailableGroupsAndDiscussions),
  trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => null),
];

export const Default: Story = {
  args: {
    handleClose() {},
    initialUnitNumber: unit1.unitNumber ?? undefined,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: commonHandlers,
    },
  },
};

export const AlternativeUnit: Story = {
  args: {
    handleClose() {},
    initialUnitNumber: unit2.unitNumber ?? undefined,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: commonHandlers,
    },
  },
};

export const NoAvailableGroups: Story = {
  args: {
    handleClose() {},
    initialUnitNumber: unit3.unitNumber ?? undefined,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: commonHandlers,
    },
  },
};

export const ManyGroups: Story = {
  args: {
    handleClose() {},
    initialUnitNumber: unit1.unitNumber ?? undefined,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.users.getUser.query(() => mockUser),
        trpcStorybookMsw.courses.getBySlug.query(() => mockCourseData),
        trpcStorybookMsw.courseRegistrations.getByCourseId.query(() => mockCourseRegistration),
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(() => mockManyGroupsData),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => null),
      ],
    },
  },
};

export const Loading: Story = {
  args: {
    handleClose() {},
    initialUnitNumber: unit1.unitNumber ?? undefined,
    courseSlug: 'ai-safety',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.users.getUser.query(async () => {
          await delay(2000);
          return mockUser;
        }),
        trpcStorybookMsw.courses.getBySlug.query(async () => {
          // You may need to reload the page to force this delay and see the loading state.
          await delay(2000);
          return mockCourseData;
        }),
        trpcStorybookMsw.courseRegistrations.getByCourseId.query(async () => {
          await delay(2000);
          return mockCourseRegistration;
        }),
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(async () => {
          await delay(2000);
          return mockAvailableGroupsAndDiscussions;
        }),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => null),
      ],
    },
  },
};
