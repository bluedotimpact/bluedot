import type { Meta, StoryObj } from '@storybook/react';
import DeleteAccountModal from './DeleteAccountModal';

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
    onRequested() {},
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
