import type { Meta, StoryObj } from '@storybook/react';
import { UserSearchModal } from './UserSearchModal';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';

const mockUsers = [
  {
    id: 'rec123',
    email: 'alice@example.com',
    name: 'Alice Test',
    lastSeenAt: '2024-11-30T10:30:00Z',
    courseCount: 3,
  },
  {
    id: 'rec456',
    email: 'bob@example.com',
    name: 'Bob Smith',
    lastSeenAt: '2024-11-29T15:45:00Z',
    courseCount: 1,
  },
  {
    id: 'rec789',
    email: 'charlie@example.com',
    name: 'Charlie Brown',
    lastSeenAt: null,
    courseCount: 0,
  },
];

const meta = {
  title: 'website/admin/UserSearchModal',
  component: UserSearchModal,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
  args: {
    isOpen: true,
    onClose: () => {},
  },
} satisfies Meta<typeof UserSearchModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
  parameters: {
    msw: {
      handlers: [
        trpcStorybookMsw.admin.searchUsers.query(({ input }) => {
          const query = input.query?.toLowerCase() || '';

          if (!query) return mockUsers;

          return mockUsers.filter((user) => user.name?.toLowerCase().includes(query));
        }),
      ],
    },
  },
};
