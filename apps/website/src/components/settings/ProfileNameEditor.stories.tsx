import type { Meta, StoryObj } from '@storybook/react';
import ProfileNameEditor from './ProfileNameEditor';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { joinName } from '../../lib/name';

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
        trpcStorybookMsw.users.updateName.mutation(({ input }) => ({ ...mockUser, ...input, name: joinName(input.firstName, input.lastName) })),
      ],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StoredFirstAndLastName: Story = {
  args: {
    user: { firstName: 'Jane', lastName: 'Doe', name: 'Jane Doe' },
  },
};

/** Existing users only have a combined name: it's split on the last space as a prefill for them to confirm */
export const PrefilledFromCombinedName: Story = {
  args: {
    user: { firstName: null, lastName: null, name: 'Maria de la Cruz' },
  },
};

export const NewUserWithNoName: Story = {
  args: {
    user: { firstName: null, lastName: null, name: '' },
  },
};
