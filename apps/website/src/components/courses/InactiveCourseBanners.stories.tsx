import type { Meta, StoryObj } from '@storybook/react';
import { createMockGroup } from '../../__tests__/testUtils';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { ONE_HOUR_SECONDS } from '../../lib/constants';
import type { DiscussionsAvailable } from '../../server/routers/group-switching';
import InactiveCourseBanners from './InactiveCourseBanners';

const mockAvailableGroups: DiscussionsAvailable = {
  groupsAvailable: [
    {
      group: createMockGroup({
        id: 'group-1',
        groupName: 'Group 01: Mahatma Gandhi',
        startTimeUtc: Math.floor(new Date('2024-10-19T13:00:00Z').getTime() / 1000),
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 3,
    },
    {
      group: createMockGroup({
        id: 'group-2',
        groupName: 'Group 03: Alexei Navalny',
        startTimeUtc: Math.floor(new Date('2024-10-19T16:00:00Z').getTime() / 1000) + ONE_HOUR_SECONDS,
      }),
      userIsParticipant: false,
      spotsLeftIfKnown: 1,
    },
  ],
  discussionsAvailable: {},
};

const meta = {
  title: 'website/courses/InactiveCoursesBanner',
  component: InactiveCourseBanners,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof InactiveCourseBanners>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.meetPerson.getInactiveCourseRegistrations.query(() => [
          { courseRegistrationId: 'rec123456789', courseSlug: 'agi-safety-fundamentals', roundId: 'round-1' },
        ]),
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => ({
          intense: [],
          partTime: [
            {
              id: 'round-next',
              intensity: 'Part-time',
              applicationDeadline: '15 May',
              applicationDeadlineRaw: '2026-05-15',
              firstDiscussionDateRaw: '2026-06-01',
              dateRange: '1 Jun - 20 Jul',
              numberOfUnits: 8,
            },
          ],
        })),
        trpcStorybookMsw.groupSwitching.discussionsAvailable.query(() => mockAvailableGroups),
        trpcStorybookMsw.groupSwitching.switchGroup.mutation(() => null),
      ],
    },
  },
};
