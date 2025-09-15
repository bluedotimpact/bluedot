import { render, waitFor } from '@testing-library/react';
import {
  describe, test, expect, beforeEach, vi,
} from 'vitest';
import { OidcClient } from 'oidc-client-ts';
import { LoginOauthCallbackPage, LoginRedirectPage, loginPresets } from './Login';
import { Navigate } from './Navigate';
import { useAuthStore } from './utils/auth';
import { getQueryParam } from './utils/getQueryParam';
import '@testing-library/jest-dom';

const mockSetAuth = vi.fn();
vi.mock('./utils/auth', () => ({
  useAuthStore: vi.fn((selector) => {
    const store = {
      auth: null,
      setAuth: mockSetAuth,
    };
    return selector(store);
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

const CUSTOM_REDIRECT_PATH = '/custom-path';
const OIDC_PROVIDER_URL = 'https://mock-oidc-provider.com/';

describe('LoginRedirectPage', () => {
  const mockLoginPreset = loginPresets.keycloak;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should navigate to the redirect_to value when auth is present', () => {
    vi.mocked(useAuthStore).mockReturnValue({ auth: { token: 'test-token' } });
    vi.mocked(getQueryParam).mockReturnValue(CUSTOM_REDIRECT_PATH);

    render(<LoginRedirectPage loginPreset={mockLoginPreset} />);

    expect(Navigate).toHaveBeenCalledWith({
      url: CUSTOM_REDIRECT_PATH,
    }, expect.anything());

    expect(OidcClient).not.toHaveBeenCalled();
  });

  test('if not authed, should createSigninRequest with redirect_to query param', async () => {
    vi.mocked(useAuthStore).mockReturnValue(null);
    vi.mocked(getQueryParam).mockReturnValue(CUSTOM_REDIRECT_PATH);

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
        attribution: expect.any(Object),
      },
    });

    expect(window.location.href).toBe(OIDC_PROVIDER_URL);
  });

  test('if not authed and no redirect_to, should createSigninRequest with default redirect path', async () => {
    vi.mocked(useAuthStore).mockReturnValue(null);
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
        attribution: expect.any(Object),
      },
    });

    expect(window.location.href).toBe(OIDC_PROVIDER_URL);
  });
});

describe('LoginOauthCallbackPage', () => {
  const mockLoginPreset = loginPresets.keycloak;
  const userRedirectPath = '/some-path';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('should set auth and call `onLoginComplete` on success', async () => {
    const mockOnLoginComplete = vi.fn();
    const mockUser = {
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      id_token: 'id-token',
      refresh_token: 'refresh-token',
      profile: {
        email: 'email@bluedot.org',
        sub: 'sub-id',
      },
      userState: {
        redirectTo: userRedirectPath,
      },
      url: OIDC_PROVIDER_URL,
    };

    mockProcessSigninResponse.mockResolvedValue(mockUser);

    render(
      <LoginOauthCallbackPage
        loginPreset={mockLoginPreset}
        onLoginComplete={mockOnLoginComplete}
      />,
    );

    await waitFor(() => {
      expect(OidcClient).toHaveBeenCalledTimes(1);
    });

    expect(OidcClient).toHaveBeenCalledWith(mockLoginPreset.oidcSettings);

    expect(mockProcessSigninResponse).toHaveBeenCalledTimes(1);
    expect(mockProcessSigninResponse).toHaveBeenCalledWith(window.location.href);

    const expectedAuthObject = {
      expiresAt: mockUser.expires_at * 1000,
      token: mockUser.id_token,
      refreshToken: mockUser.refresh_token,
      oidcSettings: mockLoginPreset.oidcSettings,
      email: mockUser.profile.email,
    };

    expect(mockSetAuth).toHaveBeenCalledTimes(1);
    expect(mockSetAuth).toHaveBeenCalledWith(expectedAuthObject);

    expect(mockOnLoginComplete).toHaveBeenCalledTimes(1);
    expect(mockOnLoginComplete).toHaveBeenCalledWith(expectedAuthObject);

    expect(mockPush).toHaveBeenCalledTimes(1);
    expect(mockPush).toHaveBeenCalledWith(userRedirectPath);
    // });
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
    const mockUser = {
      // Commenting out to simulate missing expires_at
      // expires_at: Math.floor(Date.now() / 1000) + 3600,
      id_token: 'id-token',
      profile: {
        email: 'email@bluedot.org',
      },
    };
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
    const mockUser = {
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      // Commenting out to simulate missing id_token
      // id_token: 'id-token',
      profile: {
        email: 'email@bluedot.org',
      },
    };
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
});
