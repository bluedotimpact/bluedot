import type { Meta, StoryObj } from '@storybook/react';
import type { User } from '@bluedot/db';
import AccountSettingsPage from '../../pages/account';
import { trpcStorybookMsw } from '../../__tests__/trpcMswSetup.browser';
import { joinName } from '../../lib/name';

const baseUser: User = {
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

const handlersFor = (user: User) => [
  trpcStorybookMsw.users.getUser.query(() => user),
  trpcStorybookMsw.users.updateName.mutation(({ input }) => ({ ...user, ...input, name: joinName(input.firstName, input.lastName) })),
  trpcStorybookMsw.myBluedot.hasFacilitatorNavItems.query(() => ({ hasFacilitatedCourses: false, hasFacilitatorApplications: false })),
];

const meta: Meta<typeof AccountSettingsPage> = {
  title: 'website/settings/AccountPage',
  component: AccountSettingsPage,
  parameters: {
    layout: 'fullscreen',
    msw: { handlers: handlersFor(baseUser) },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const StoredFirstAndLastName: Story = {};

/** Existing users only have a combined name: it's split on the last space as a prefill for them to confirm */
export const PrefilledFromCombinedName: Story = {
  parameters: {
    msw: {
      handlers: handlersFor({
        ...baseUser, name: 'Maria de la Cruz', firstName: null, lastName: null,
      }),
    },
  },
};

/** A blank name opens the welcome modal, which reuses the same editor */
export const NewUserWelcomeModal: Story = {
  parameters: {
    msw: {
      handlers: handlersFor({
        ...baseUser, name: '', firstName: null, lastName: null,
      }),
    },
  },
};
