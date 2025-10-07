import { render } from '@testing-library/react';
import {
  describe, expect, test, vi, beforeEach, type Mock,
} from 'vitest';
import useAxios from 'axios-hooks';
import AccountSettingsPage from '../../../pages/settings/account';
import { TrpcWrapper } from '../../trpcWrapper';

// Mock dependencies
vi.mock('axios-hooks');

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

const mockedUseAxios = useAxios as unknown as Mock;

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
    user: {
      name: 'John Doe',
      email: 'john.doe@example.com',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock for useAxios to return user data
    mockedUseAxios.mockReturnValue([{
      data: mockUserData,
      loading: false,
      error: null,
    }]);
  });

  test('should render account settings page correctly', () => {
    // The component expects an auth prop
    const mockAuth = { token: 'test-token' };

    // Cast the component to accept auth prop since we mocked withAuth
    const AccountSettingsPageWithAuth = AccountSettingsPage as React.ComponentType<{ auth: { token: string } }>;

    const { container } = render(<AccountSettingsPageWithAuth auth={mockAuth} />, { wrapper: TrpcWrapper });

    expect(container).toMatchSnapshot();
  });
});
