import type { Meta, StoryObj } from '@storybook/react';
import ProfileNameEditor from './ProfileNameEditor';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { userNameFields } from '../../lib/utils';

const mockUser = {
  id: 'rec123',
  email: 'jane@example.com',
  name: 'Jane Doe',
  firstName: 'Jane',
  lastName: 'Doe',
  createdAt: null,
  lastSeenAt: null,
  firstLoggedInAt: null,
  utmSource: null,
  utmCampaign: null,
  utmContent: null,
  autoNumberId: null,
  isAdmin: null,
  keycloakIdentifier: null,
  allowedImpersonationTargets: [],
};

const meta: Meta<typeof ProfileNameEditor> = {
  title: 'website/settings/ProfileNameEditor',
  component: ProfileNameEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: [
        trpcStorybookMsw.users.updateName.mutation(({ input }) => ({ ...mockUser, ...userNameFields(input) })),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    user: { firstName: 'Jane', lastName: 'Doe' },
  },
};

export const NewUserWithNoName: Story = {
  args: {
    user: { firstName: null, lastName: null },
  },
};

