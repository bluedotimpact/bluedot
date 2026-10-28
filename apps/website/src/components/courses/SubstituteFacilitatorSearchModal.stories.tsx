import type { Meta, StoryObj } from '@storybook/react';
import SubstituteFacilitatorSearchModal from './SubstituteFacilitatorSearchModal';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const mockCandidates = [
  { userId: 'user-1', name: 'Aisha Kamara', hasFacilitatedThisCourse: true },
  { userId: 'user-2', name: 'Ben Okafor', hasFacilitatedThisCourse: false },
  { userId: 'user-3', name: 'Clara Ndubuisi', hasFacilitatedThisCourse: true },
];

const meta: Meta<typeof SubstituteFacilitatorSearchModal> = {
  title: 'website/courses/SubstituteFacilitatorSearchModal',
  component: SubstituteFacilitatorSearchModal,
  parameters: {
    layout: 'fullscreen',
    msw: {
      handlers: [
        trpcStorybookMsw.facilitators.searchSubstituteCandidates.query(({ input }) => {
          const term = input.searchTerm.toLowerCase();
          return mockCandidates.filter((c) => c.name.toLowerCase().includes(term));
        }),
      ],
    },
  },
  args: {
    roundId: 'mock-round-id',
    discussionId: 'discussion-2',
    onSelect() {},
    onClose() {},
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
