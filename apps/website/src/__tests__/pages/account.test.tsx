import '@testing-library/jest-dom';
import {
  fireEvent, render, screen, waitFor, within,
} from '@testing-library/react';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import AccountSettingsPage from '../../pages/account';
import { userTable } from '@bluedot/db';
import { TrpcProvider } from '../trpcProvider';
import { server, trpcMsw } from '../trpcMswSetup';
import {
  createTrpcDbProvider, seedLoggedInUser, setupTestDb, testAuthContextLoggedIn, testDb,
} from '../dbTestUtils';

// Only mock withAuth from @bluedot/ui since it wraps the component with auth logic
// withAuth is a HOC that normally provides auth props from a zustand store
// For testing, we bypass it to directly test the component with mock auth
vi.mock('@bluedot/ui', async () => {
  const actual = await vi.importActual('@bluedot/ui');
  return {
    ...actual,
    withAuth: (Component: React.ComponentType<{ auth: { token: string } }>) => Component,
  };
});

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/account',
    push: vi.fn(),
  }),
}));

// Mock Next.js Head component
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

setupTestDb();

describe('AccountSettingsPage', () => {
  const mockUserData = {
    name: 'John Doe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // @ts-expect-error Only mocking data needed for `AccountSettingsPage`
    server.use(trpcMsw.users.getUser.query(() => mockUserData));
    server.use(trpcMsw.myBluedot.hasFacilitatorNavItems.query(() => ({ hasFacilitatedCourses: false, hasFacilitatorApplications: false })));
  });

  test('should render account settings page correctly', async () => {
    // The component expects an auth prop
    const mockAuth = { token: 'test-token' };

    // Cast the component to accept auth prop since we mocked withAuth
    const AccountSettingsPageWithAuth = AccountSettingsPage as React.ComponentType<{ auth: { token: string } }>;

    const { container } = render(<AccountSettingsPageWithAuth auth={mockAuth} />, { wrapper: TrpcProvider });

    // Wait for the user data to load and the content to render
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockUserData.firstName)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockUserData.lastName)).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });

  test('a name saved via the welcome modal shows in the page editor', async () => {
    await seedLoggedInUser({ name: '' });

    const AccountSettingsPageWithAuth = AccountSettingsPage as React.ComponentType<{ auth: { token: string } }>;
    render(<AccountSettingsPageWithAuth auth={{ token: 'test-token' }} />, { wrapper: createTrpcDbProvider(testAuthContextLoggedIn) });

    const modal = await screen.findByRole('dialog');
    fireEvent.change(within(modal).getByLabelText('First name'), { target: { value: 'Jane' } });
    fireEvent.change(within(modal).getByLabelText('Last name'), { target: { value: 'Smith' } });
    fireEvent.click(within(modal).getByRole('button', { name: 'Save profile name changes' }));

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Smith')).toBeInTheDocument();
    });

    const user = await testDb.get(userTable, { email: 'test@example.com' });
    expect(user).toMatchObject({ firstName: 'Jane', lastName: 'Smith', name: 'Jane Smith' });
  });
});
