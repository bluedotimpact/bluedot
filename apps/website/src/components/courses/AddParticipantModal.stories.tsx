import type { Meta, StoryObj } from '@storybook/react';
import AddParticipantModal from './AddParticipantModal';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta: Meta<typeof AddParticipantModal> = {
  title: 'website/courses/AddParticipantModal',
  component: AddParticipantModal,
  parameters: { layout: 'fullscreen' },
  args: {
    meetPersonId: 'rec-facilitator-1',
    excludeIds: [],
    onAdd: () => {},
    onClose: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const samplePeople = [
  { id: 'rec1', name: 'Aisha Kamara' },
  { id: 'rec2', name: 'Ben Okafor' },
  { id: 'rec3', name: 'Clara Ndubuisi' },
  { id: 'rec4', name: 'Diego Herrera' },
];

export const Populated: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.searchAddableParticipants.query(() => samplePeople),
      ],
    },
  },
};

export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.searchAddableParticipants.query(() => []),
      ],
    },
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.searchAddableParticipants.query(() => new Promise(() => {})),
      ],
    },
  },
};

export const ErrorState: Story = {
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.searchAddableParticipants.query(() => {
          throw new Error('Search failed');
        }),
      ],
    },
  },
};
