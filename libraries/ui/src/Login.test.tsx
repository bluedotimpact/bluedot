import { render, waitFor } from '@testing-library/react';
import {
  afterEach, describe, expect, test, vi,
} from 'vitest';
import { OidcClient } from 'oidc-client-ts';
import { LoginOauthCallbackPage, LoginRedirectPage, loginPresets } from './Login';
import { Navigate } from './Navigate';
import { useAuthStore } from './utils/auth';
import { getQueryParam } from './utils/getQueryParam';
import '@testing-library/jest-dom';

const CUSTOM_REDIRECT_PATH = '/custom-path';
const OIDC_PROVIDER_URL = 'https://mock-oidc-provider.com/';

const mockSetAuth = vi.fn();
const defaultMockStore = {
  auth: null, // no auth by default
  setAuth: mockSetAuth,
  internal_clearTimer: null,
  internal_refreshTimer: null,
};
vi.mock('./utils/auth', () => ({
  useAuthStore: vi.fn((selector) => {
    return selector(defaultMockStore);
  }),
}));

vi.mock('./Navigate', () => ({
  Navigate: vi.fn(() => null),
}));

vi.mock('./utils/getQueryParam', () => ({
  getQueryParam: vi.fn(),
}));

const mockPush = vi.fn();
vi.mock('next/router', () => ({
  useRouter: vi.fn(() => ({
    push: mockPush,
  })),
}));

const mockCreateSigninRequest = vi.fn(() => Promise.resolve({
  url: OIDC_PROVIDER_URL,
}));
const mockProcessSigninResponse = vi.fn();

vi.mock('oidc-client-ts', () => {
  return {
    OidcClient: vi.fn().mockImplementation(() => ({
      createSigninRequest: mockCreateSigninRequest,
      processSigninResponse: mockProcessSigninResponse,
    })),
  };
});

const createMockUser = (overrides = {}) => ({
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  id_token: 'id-token',
  refresh_token: 'refresh-token',
  profile: {
    email: 'email@bluedot.org',
    sub: 'sub-id',
  },
  userState: {
    redirectTo: CUSTOM_REDIRECT_PATH,
  },
  url: OIDC_PROVIDER_URL,
  ...overrides,
});

const originalWindowLocation = window.location;

afterEach(() => {
  vi.clearAllMocks();

  vi.mocked(useAuthStore).mockImplementation((selector) => {
    return selector(defaultMockStore);
  });

  // Create a new mock to prevent modifying the original window.location
  // Using a spread doesn't work because some properties (like href) are readonly
  const mockLocation = new URL(originalWindowLocation.href);
  Object.assign(mockLocation, {
    assign: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
  });

  Object.defineProperty(window, 'location', {
    value: mockLocation,
    configurable: true,
    writable: true,
  });
});

describe('LoginRedirectPage', () => {
  const mockLoginPreset = loginPresets.keycloak;

  test('should navigate to the redirect_to value when auth is present', () => {
    vi.mocked(useAuthStore).mockReturnValue({ auth: { token: 'test-token' } });
    vi.mocked(getQueryParam).mockReturnValueOnce(CUSTOM_REDIRECT_PATH);

    render(<LoginRedirectPage loginPreset={mockLoginPreset} />);

    expect(Navigate).toHaveBeenCalledWith({
      url: CUSTOM_REDIRECT_PATH,
    }, expect.anything());

    expect(OidcClient).not.toHaveBeenCalled();
  });

  test('if not authed, should createSigninRequest with redirect_to query param', async () => {
    vi.mocked(getQueryParam).mockReturnValueOnce(CUSTOM_REDIRECT_PATH);

    render(<LoginRedirectPage loginPreset={mockLoginPreset} />);

    // `waitFor` is needed because createSigninRequest is called in a useEffect
    await waitFor(() => {
      expect(OidcClient).toHaveBeenCalledTimes(1);
    });

    expect(OidcClient).toHaveBeenCalledWith(mockLoginPreset.oidcSettings);

    expect(mockCreateSigninRequest).toHaveBeenCalledTimes(1);
    expect(mockCreateSigninRequest).toHaveBeenCalledWith({
      request_type: 'si:r',
      state: {
        redirectTo: CUSTOM_REDIRECT_PATH,
      },
    });

    expect(window.location.href).toBe(OIDC_PROVIDER_URL);
  });

  test('if not authed and no redirect_to, should createSigninRequest with default redirect path', async () => {
    vi.mocked(getQueryParam).mockReturnValue(null);

    render(<LoginRedirectPage loginPreset={mockLoginPreset} />);

    // `waitFor` is needed because createSigninRequest is called in a useEffect
    await waitFor(() => {
      expect(OidcClient).toHaveBeenCalledTimes(1);
    });

    expect(OidcClient).toHaveBeenCalledWith(mockLoginPreset.oidcSettings);

    expect(mockCreateSigninRequest).toHaveBeenCalledTimes(1);
    expect(mockCreateSigninRequest).toHaveBeenCalledWith({
      request_type: 'si:r',
      state: {
        redirectTo: '/',
      },
    });

    expect(window.location.href).toBe(OIDC_PROVIDER_URL);
  });

  test('should prefill email in login_hint when email query param is provided', async () => {
    const testEmail = 'test@example.com';

    vi.mocked(getQueryParam).mockReturnValueOnce(null); // redirect_to
    vi.mocked(getQueryParam).mockReturnValueOnce(testEmail); // email

    render(<LoginRedirectPage loginPreset={mockLoginPreset} />);

    await waitFor(() => {
      expect(OidcClient).toHaveBeenCalledTimes(1);
    });

    expect(OidcClient).toHaveBeenCalledWith({
      ...mockLoginPreset.oidcSettings,
      extraQueryParams: {
        login_hint: testEmail,
      },
    });

    expect(mockCreateSigninRequest).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe(OIDC_PROVIDER_URL);
  });
});

describe('LoginOauthCallbackPage', () => {
  const mockLoginPreset = loginPresets.keycloak;

  test('should set auth and call `onLoginComplete` on success', async () => {
    const mockOnLoginComplete = vi.fn();
    const mockUser = createMockUser();
    mockProcessSigninResponse.mockResolvedValue(mockUser);

    render(
      <LoginOauthCallbackPage
        loginPreset={mockLoginPreset}
        onLoginComplete={mockOnLoginComplete}
      />,
    );

    const expectedAuthObject = {
      expiresAt: mockUser.expires_at * 1000,
      token: mockUser.id_token,
      refreshToken: mockUser.refresh_token,
      oidcSettings: mockLoginPreset.oidcSettings,
      email: mockUser.profile.email,
    };

    await waitFor(() => {
      expect(mockOnLoginComplete).toHaveBeenCalledTimes(1);
      expect(mockOnLoginComplete).toHaveBeenCalledWith(expectedAuthObject, CUSTOM_REDIRECT_PATH);
    });

    expect(OidcClient).toHaveBeenCalledTimes(1);
    expect(OidcClient).toHaveBeenCalledWith(mockLoginPreset.oidcSettings);

    expect(mockProcessSigninResponse).toHaveBeenCalledTimes(1);
    expect(mockProcessSigninResponse).toHaveBeenCalledWith(window.location.href);

    expect(mockSetAuth).toHaveBeenCalledTimes(1);
    expect(mockSetAuth).toHaveBeenCalledWith(expectedAuthObject);
    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(CUSTOM_REDIRECT_PATH);
  });

  test('should throw error if no user returned', async () => {
    mockProcessSigninResponse.mockResolvedValue(null);

    const { getByText } = render(<LoginOauthCallbackPage loginPreset={mockLoginPreset} />);

    await waitFor(() => {
      expect(OidcClient).toHaveBeenCalledTimes(1);
    });

    expect(mockProcessSigninResponse).toHaveBeenCalledTimes(1);
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(getByText('Bad login response: No user returned')).toBeInTheDocument();
  });

  test('should throw error if user.expires_at is missing', async () => {
    const mockUser = createMockUser({ expires_at: undefined });

    mockProcessSigninResponse.mockResolvedValue(mockUser);

    const { getByText } = render(<LoginOauthCallbackPage loginPreset={mockLoginPreset} />);

    await waitFor(() => {
      expect(OidcClient).toHaveBeenCalledTimes(1);
    });

    expect(mockProcessSigninResponse).toHaveBeenCalledTimes(1);
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(getByText('Bad login response: user.expires_at is missing or not a number')).toBeInTheDocument();
  });

  test('should throw error if user.id_token is missing', async () => {
    const mockUser = createMockUser({ id_token: undefined });
    mockProcessSigninResponse.mockResolvedValue(mockUser);

    const { getByText } = render(<LoginOauthCallbackPage loginPreset={mockLoginPreset} />);

    await waitFor(() => {
      expect(OidcClient).toHaveBeenCalledTimes(1);
    });

    expect(mockProcessSigninResponse).toHaveBeenCalledTimes(1);
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(getByText('Bad login response: user.id_token is missing or not a string')).toBeInTheDocument();
  });

  test('should throw error if user.profile.email is missing', async () => {
    const mockUser = createMockUser({ profile: { email: undefined } });
    mockProcessSigninResponse.mockResolvedValue(mockUser);

    const { getByText } = render(<LoginOauthCallbackPage loginPreset={mockLoginPreset} />);

    await waitFor(() => {
      expect(OidcClient).toHaveBeenCalledTimes(1);
    });

    expect(mockProcessSigninResponse).toHaveBeenCalledTimes(1);
    expect(mockSetAuth).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
    expect(getByText('Bad login response: user.profile.email is missing or not a string')).toBeInTheDocument();
  });

  test('should redirect to "/" when userState.redirectTo is missing', async () => {
    mockProcessSigninResponse.mockResolvedValue(createMockUser({ userState: {} }));
    render(<LoginOauthCallbackPage loginPreset={mockLoginPreset} />);
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
  });

  test('should handle processSigninResponse errors', async () => {
    mockProcessSigninResponse.mockRejectedValue(new Error('Network error'));
    const { getByText } = render(<LoginOauthCallbackPage loginPreset={mockLoginPreset} />);
    await waitFor(() => expect(getByText('Network error')).toBeInTheDocument());
  });
});
