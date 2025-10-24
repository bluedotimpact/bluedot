import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import {
  describe, expect, test, vi, beforeEach,
} from 'vitest';
import AccountSettingsPage from '../../../pages/settings/account';
import { TrpcProvider } from '../../trpcProvider';
import { server, trpcMsw } from '../../trpcMswSetup';

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
    pathname: '/settings/account',
    push: vi.fn(),
  }),
}));

// Mock Next.js Head component
vi.mock('next/head', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

describe('AccountSettingsPage', () => {
  const mockUserData = {
    name: 'John Doe',
    email: 'john.doe@example.com',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // @ts-expect-error Only mocking data needed for `AccountSettingsPage`
    server.use(trpcMsw.users.getUser.query(() => mockUserData));
  });

  test('should render account settings page correctly', async () => {
    // The component expects an auth prop
    const mockAuth = { token: 'test-token' };

    // Cast the component to accept auth prop since we mocked withAuth
    const AccountSettingsPageWithAuth = AccountSettingsPage as React.ComponentType<{ auth: { token: string } }>;

    const { container } = render(<AccountSettingsPageWithAuth auth={mockAuth} />, { wrapper: TrpcProvider });

    // Wait for the user data to load and the content to render
    await waitFor(() => {
      expect(screen.getByDisplayValue(mockUserData.name)).toBeInTheDocument();
    });

    expect(container).toMatchSnapshot();
  });
});
