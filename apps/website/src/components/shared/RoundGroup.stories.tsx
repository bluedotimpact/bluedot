import type { Meta, StoryObj } from '@storybook/react';
import { createMockRound } from '../../__tests__/testUtils';
import RoundGroup from './RoundGroup';

const intensiveRounds = [
  createMockRound({ dateRange: '20 – 24 Jan' }),
  createMockRound({
    applicationDeadline: '12 Feb',
    applicationDeadlineRaw: '2025-02-12',
    firstDiscussionDateRaw: '2025-02-17',
    dateRange: '17 – 21 Feb',
  }),
  createMockRound({
    applicationDeadline: '12 Mar',
    applicationDeadlineRaw: '2025-03-12',
    firstDiscussionDateRaw: '2025-03-17',
    dateRange: '17 – 21 Mar',
  }),
  createMockRound({
    applicationDeadline: '9 Apr',
    applicationDeadlineRaw: '2025-04-09',
    firstDiscussionDateRaw: '2025-04-14',
    dateRange: '14 – 18 Apr',
  }),
];

const partTimeRounds = [
  createMockRound({
    intensity: 'part-time',
    applicationDeadlineRaw: '2025-01-15',
    firstDiscussionDateRaw: '2025-01-20',
    dateRange: '20 Jan – 24 Feb',
    numberOfUnits: 6,
  }),
  createMockRound({
    intensity: 'part-time',
    applicationDeadline: '5 Mar',
    applicationDeadlineRaw: '2025-03-05',
    firstDiscussionDateRaw: '2025-03-10',
    dateRange: '10 Mar – 14 Apr',
    numberOfUnits: 6,
  }),
];

const meta: Meta<typeof RoundGroup> = {
  title: 'website/shared/RoundGroup',
  component: RoundGroup,
  parameters: {
    layout: 'padded',
  },
  args: {
    applicationUrl: 'https://bluedot.org/apply',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Intensive: Story = {
  args: {
    type: 'intensive',
    rounds: intensiveRounds,
  },
};

export const PartTime: Story = {
  args: {
    type: 'part-time',
    rounds: partTimeRounds,
  },
};

export const Capped: Story = {
  args: {
    type: 'intensive',
    rounds: intensiveRounds,
    maxRounds: 3,
  },
};
