import type { Meta, StoryObj } from '@storybook/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { delay } from 'msw';
import type { Course, Unit } from '@bluedot/db';
import GroupSwitchModal from './GroupSwitchModal';
import type { DiscussionsAvailable } from '../../server/routers/group-switching';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import {
  createMockCourse, createMockGroup, createMockGroupDiscussion, createMockUnit,
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

const mockCourseData: { course: Course, units: Unit[] } = {
  course: createMockCourse(),
  units: [
    unit1,
    unit2,
    unit3,
  ],
};

const mockSwitchingData: DiscussionsAvailable = {
  groupsAvailable: [
    {
      group: createMockGroup({
        id: 'group-1',
        groupName: 'Morning Group A',
        startTimeUtc: Math.floor(new Date('2024-01-01T09:00:00Z').getTime() / 1000), // 9:00 AM UTC
      }),
      userIsParticipant: true,
      spotsLeftIfKnown: 0,
      allDiscussionsHaveStarted: false,
    },
    {
      group: createMockGroup({
        id: 'group-2',
        groupName: 'Evening Group B',
        startTimeUtc: Math.floor(new Date('2024-01-01T19:00:00Z').getTime() / 1000), // 7:00 PM UTC
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 3,
      allDiscussionsHaveStarted: false,
    },
    {
      group: createMockGroup({
        id: 'group-3',
        groupName: 'Weekend Group C',
        startTimeUtc: Math.floor(new Date('2024-01-06T14:00:00Z').getTime() / 1000), // Saturday 2:00 PM UTC
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 0,
      allDiscussionsHaveStarted: false,
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
        hasStarted: false,
      },
      {
        discussion: createMockGroupDiscussion({
          startDateTime: Math.floor((Date.now() + 24 * 60 * 60 * 1000) / 1000), // 24 hours from now
        }),
        groupName: 'Evening Group B',
        userIsParticipant: false,
        spotsLeftIfKnown: 2,
        hasStarted: false,
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
        hasStarted: false,
      },
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
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(async () => {
          return mockSwitchingData;
        }),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => {
          return undefined;
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
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(async () => {
          return mockSwitchingData;
        }),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => {
          return undefined;
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
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(() => {
          return mockSwitchingData;
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
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(async () => {
          await delay(2000);
          return mockSwitchingData;
        }),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => {
          return undefined;
        }),
      ],
    },
  },
};
