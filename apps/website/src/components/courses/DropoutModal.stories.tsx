import type { Meta, StoryObj } from '@storybook/react';
import { TRPCError } from '@trpc/server';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { createMockCourseRegistration } from '../../__tests__/testUtils';
import DropoutModal from './DropoutModal';

const mockCourseRounds = {
  intense: [],
  partTime: [
    {
      id: 'round-next',
      intensity: 'Part-time',
      applicationDeadline: '15 May',
      applicationDeadlineDetailed: '15 May at 23:59 UTC',
      applicationDeadlineRaw: '2026-05-15',
      firstDiscussionDateRaw: '2026-06-01',
      dateRange: '1 Jun - 20 Jul',
      numberOfUnits: 8,
    },
  ],
};

const courseRoundsHandler = trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => mockCourseRounds);

const participantRegistrationsHandler = trpcStorybookMsw.courseRegistrations.getAll.query(() => []);

const meta = {
  title: 'website/courses/DropoutModal',
  component: DropoutModal,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof DropoutModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    handleClose() {},
    applicantId: 'rec123456789',
    courseSlug: 'agi-safety-fundamentals',
    currentRoundId: null,
  },
  parameters: {
    msw: {
      handlers: [
        courseRoundsHandler,
        participantRegistrationsHandler,
        trpcStorybookMsw.dropout.dropoutOrDeferral.mutation(async ({ input }) => ({
          id: 'new-dropout-id',
          applicantId: [input.applicantId],
          reason: input.reason ?? null,
          type: input.type,
          newRoundId: null,
          oldRoundId: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        })),
      ],
    },
  },
};

export const Error: Story = {
  args: {
    handleClose() {},
    applicantId: 'rec123456789',
    courseSlug: 'agi-safety-fundamentals',
    currentRoundId: null,
  },
  parameters: {
    msw: {
      handlers: [
        courseRoundsHandler,
        participantRegistrationsHandler,
        trpcStorybookMsw.dropout.dropoutOrDeferral.mutation(async () => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to submit request' });
        }),
      ],
    },
  },
};

export const NoUpcomingRounds: Story = {
  args: {
    handleClose() {},
    applicantId: 'rec123456789',
    courseSlug: 'agi-safety-fundamentals',
    currentRoundId: null,
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.courseRounds.getRoundsForCourse.query(() => ({ intense: [], partTime: [] })),
        participantRegistrationsHandler,
        trpcStorybookMsw.dropout.dropoutOrDeferral.mutation(async ({ input }) => ({
          id: 'new-dropout-id',
          applicantId: [input.applicantId],
          reason: input.reason ?? null,
          type: input.type,
          newRoundId: null,
          oldRoundId: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        })),
      ],
    },
  },
};

export const Withdraw: Story = {
  args: {
    handleClose() {},
    applicantId: 'rec123456789',
    courseSlug: 'agi-safety-fundamentals',
    currentRoundId: null,
  },
  parameters: {
    msw: {
      handlers: [
        courseRoundsHandler,
        trpcStorybookMsw.courseRegistrations.getAll.query(() => [
          createMockCourseRegistration({ id: 'rec123456789', decision: null }),
        ]),
        trpcStorybookMsw.dropout.dropoutOrDeferral.mutation(async ({ input }) => ({
          id: 'new-dropout-id',
          applicantId: [input.applicantId],
          reason: input.reason ?? null,
          type: input.type,
          newRoundId: null,
          oldRoundId: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        })),
      ],
    },
  },
};

export const Facilitator: Story = {
  args: {
    handleClose() {},
    applicantId: 'rec123456789',
    courseSlug: 'agi-safety-fundamentals',
    currentRoundId: null,
  },
  parameters: {
    msw: {
      handlers: [
        courseRoundsHandler,
        trpcStorybookMsw.courseRegistrations.getAll.query(() => [
          createMockCourseRegistration({ id: 'rec123456789', role: 'Facilitator' }),
        ]),
        trpcStorybookMsw.dropout.dropoutOrDeferral.mutation(async ({ input }) => ({
          id: 'new-dropout-id',
          applicantId: [input.applicantId],
          reason: input.reason ?? null,
          type: input.type,
          newRoundId: null,
          oldRoundId: null,
          createdAt: '2025-01-01T00:00:00.000Z',
        })),
      ],
    },
  },
};
