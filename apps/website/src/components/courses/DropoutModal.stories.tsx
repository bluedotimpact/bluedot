import type { Meta, StoryObj } from '@storybook/react';
import { TRPCError } from '@trpc/server';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import DropoutModal from './DropoutModal';

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
    handleClose: () => {},
    applicantId: 'rec123456789',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.dropout.dropoutOrDeferral.mutation(async ({ input }) => ({
          id: 'new-dropout-id',
          applicantId: [input.applicantId],
          reason: input.reason ?? null,
          isDeferral: input.isDeferral,
        })),
      ],
    },
  },
};

export const Error: Story = {
  args: {
    handleClose: () => {},
    applicantId: 'rec123456789',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.dropout.dropoutOrDeferral.mutation(async () => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to submit request' });
        }),
      ],
    },
  },
};
