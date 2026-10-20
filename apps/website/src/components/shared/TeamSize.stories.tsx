import type { Meta, StoryObj } from '@storybook/react';
import { TRPCError } from '@trpc/server';
import TeamSize from './TeamSize';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta: Meta<typeof TeamSize> = {
  title: 'Website/Shared/TeamSize',
  component: TeamSize,
  decorators: [(Story) => <p>We&apos;re <Story />, and we&apos;ve raised $71M.</p>],
  parameters: {
    msw: { handlers: [trpcStorybookMsw.teamMembers.getActiveCount.query(() => 18)] },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithAdjective: Story = {
  args: { adjective: 'global' },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [trpcStorybookMsw.teamMembers.getActiveCount.query(() => new Promise<number>(() => {}))],
    },
  },
};

export const Error: Story = {
  parameters: {
    msw: {
      handlers: [trpcStorybookMsw.teamMembers.getActiveCount.query(() => {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Failed to count team members' });
      })],
    },
  },
};
