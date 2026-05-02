import type { Meta, StoryObj } from '@storybook/react';
import { TRPCError } from '@trpc/server';
import ParticipantFeedbackModal from './ParticipantFeedbackModal';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta: Meta<typeof ParticipantFeedbackModal> = {
  title: 'website/courses/ParticipantFeedbackModal',
  component: ParticipantFeedbackModal,
  parameters: { layout: 'fullscreen' },
  args: {
    meetPersonId: 'rec-facilitator',
    participant: { id: 'rec-aisha', name: 'Aisha Kamara' },
    followUpOptions: [
      { id: 'sel1', name: 'No further action needed', actionable: false },
      { id: 'sel2', name: 'Add to talent pipeline [keep warm for future opportunities/check-ins]', actionable: false },
      { id: 'sel3', name: 'Flag for 1-1 advising with BlueDot team', actionable: true },
      { id: 'sel4', name: 'Flag as candidate for funding (career transition/project)', actionable: true },
      { id: 'sel5', name: 'Recommend to facilitate', actionable: true },
    ],
    onClose: () => {},
    onSaved: () => {},
    onNoStrongImpression: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const successHandler = trpcStorybookMsw.facilitators.savePeerFeedback.mutation(async () => ({ id: 'rec-saved' } as never));

export const Default: Story = {
  parameters: {
    msw: { handlers: [successHandler] },
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.savePeerFeedback.mutation(async () => {
          throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Save failed' });
        }),
      ],
    },
  },
};
