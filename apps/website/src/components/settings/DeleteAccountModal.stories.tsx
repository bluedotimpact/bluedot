import type { Meta, StoryObj } from '@storybook/react';
import DeleteAccountModal from './DeleteAccountModal';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const meta = {
  title: 'website/settings/DeleteAccountModal',
  component: DeleteAccountModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    isOpen: true,
    setIsOpen() {},
  },
} satisfies Meta<typeof DeleteAccountModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AdminDeletingSomeoneElse: Story = {
  args: {
    initiatedBy: 'admin',
    userId: 'rec123',
  },
};

export const UserDeletingTheirOwnAccount: Story = {
  args: {
    initiatedBy: 'user',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.deletionRequests.selfDeletionEligibility.query(() => ({ hasEverFacilitated: false })),
      ],
    },
  },
};

export const UserWhoHasFacilitated: Story = {
  args: {
    initiatedBy: 'user',
  },
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.deletionRequests.selfDeletionEligibility.query(() => ({ hasEverFacilitated: true })),
      ],
    },
  },
};
